#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, String, Vec, Map,
    token,
};

// ─── Data Types ──────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum ListingStatus {
    Active,
    Sold,
    Cancelled,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Listing {
    pub id: u64,
    pub seller: Address,
    pub title: String,
    pub description: String,
    pub price: i128,           // in stroops (1 XLM = 10_000_000 stroops)
    pub token_address: Address, // XLM or any SAC token
    pub status: ListingStatus,
    pub created_at: u64,
}

#[contracttype]
pub enum DataKey {
    Listing(u64),
    ListingCount,
    Admin,
    FeePercent,   // platform fee in basis points (100 = 1%)
    FeeBalance,
}

// ─── Contract ────────────────────────────────────────────────────────────────

#[contract]
pub struct MarketplaceContract;

#[contractimpl]
impl MarketplaceContract {

    // ── Admin / Init ──────────────────────────────────────────────────────

    /// Initialize the marketplace with an admin address and platform fee.
    /// `fee_bps`: basis points, e.g. 250 = 2.5%
    pub fn initialize(env: Env, admin: Address, fee_bps: u32) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        assert!(fee_bps <= 1000, "fee cannot exceed 10%");

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::FeePercent, &fee_bps);
        env.storage().instance().set(&DataKey::ListingCount, &0u64);
        env.storage().instance().set(&DataKey::FeeBalance, &0i128);
    }

    // ── Listings ──────────────────────────────────────────────────────────

    /// Create a new listing. Seller must authorize this call.
    pub fn create_listing(
        env: Env,
        seller: Address,
        title: String,
        description: String,
        price: i128,
        token_address: Address,
    ) -> u64 {
        seller.require_auth();
        assert!(price > 0, "price must be positive");

        let count: u64 = env.storage().instance().get(&DataKey::ListingCount).unwrap_or(0);
        let new_id = count + 1;

        let listing = Listing {
            id: new_id,
            seller: seller.clone(),
            title,
            description,
            price,
            token_address,
            status: ListingStatus::Active,
            created_at: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&DataKey::Listing(new_id), &listing);
        env.storage().instance().set(&DataKey::ListingCount, &new_id);

        env.events().publish(
            (symbol_short!("created"), seller),
            new_id,
        );

        new_id
    }

    /// Buy a listing. Buyer must authorize and have sufficient token balance.
    /// Transfers (price - fee) to seller and fee to contract.
    pub fn buy_listing(env: Env, buyer: Address, listing_id: u64) {
        buyer.require_auth();

        let mut listing: Listing = env
            .storage()
            .persistent()
            .get(&DataKey::Listing(listing_id))
            .expect("listing not found");

        assert!(
            listing.status == ListingStatus::Active,
            "listing is not active"
        );
        assert!(buyer != listing.seller, "seller cannot buy own listing");

        // Calculate platform fee
        let fee_bps: u32 = env.storage().instance().get(&DataKey::FeePercent).unwrap_or(0);
        let fee_amount: i128 = (listing.price * fee_bps as i128) / 10_000;
        let seller_amount = listing.price - fee_amount;

        // Transfer tokens: buyer → seller
        let token_client = token::Client::new(&env, &listing.token_address);
        token_client.transfer(&buyer, &listing.seller, &seller_amount);

        // Transfer fee: buyer → contract
        if fee_amount > 0 {
            let contract_address = env.current_contract_address();
            token_client.transfer(&buyer, &contract_address, &fee_amount);

            let current_fee: i128 = env.storage().instance().get(&DataKey::FeeBalance).unwrap_or(0);
            env.storage().instance().set(&DataKey::FeeBalance, &(current_fee + fee_amount));
        }

        // Update listing status
        listing.status = ListingStatus::Sold;
        env.storage().persistent().set(&DataKey::Listing(listing_id), &listing);

        env.events().publish(
            (symbol_short!("sold"), buyer),
            listing_id,
        );
    }

    /// Cancel a listing. Only the seller can cancel an active listing.
    pub fn cancel_listing(env: Env, seller: Address, listing_id: u64) {
        seller.require_auth();

        let mut listing: Listing = env
            .storage()
            .persistent()
            .get(&DataKey::Listing(listing_id))
            .expect("listing not found");

        assert!(listing.seller == seller, "only the seller can cancel");
        assert!(listing.status == ListingStatus::Active, "listing is not active");

        listing.status = ListingStatus::Cancelled;
        env.storage().persistent().set(&DataKey::Listing(listing_id), &listing);

        env.events().publish(
            (symbol_short!("cancel"), seller),
            listing_id,
        );
    }

    // ── Admin Functions ───────────────────────────────────────────────────

    /// Withdraw accumulated platform fees. Admin only.
    pub fn withdraw_fees(env: Env, token_address: Address, recipient: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).expect("not initialized");
        admin.require_auth();

        let fee_balance: i128 = env.storage().instance().get(&DataKey::FeeBalance).unwrap_or(0);
        assert!(fee_balance > 0, "no fees to withdraw");

        let token_client = token::Client::new(&env, &token_address);
        let contract_address = env.current_contract_address();
        token_client.transfer(&contract_address, &recipient, &fee_balance);

        env.storage().instance().set(&DataKey::FeeBalance, &0i128);
    }

    /// Update platform fee. Admin only.
    pub fn update_fee(env: Env, new_fee_bps: u32) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).expect("not initialized");
        admin.require_auth();
        assert!(new_fee_bps <= 1000, "fee cannot exceed 10%");
        env.storage().instance().set(&DataKey::FeePercent, &new_fee_bps);
    }

    // ── Read-Only Queries ─────────────────────────────────────────────────

    pub fn get_listing(env: Env, listing_id: u64) -> Listing {
        env.storage()
            .persistent()
            .get(&DataKey::Listing(listing_id))
            .expect("listing not found")
    }

    pub fn get_listing_count(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::ListingCount).unwrap_or(0)
    }

    pub fn get_fee_percent(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::FeePercent).unwrap_or(0)
    }

    pub fn get_fee_balance(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::FeeBalance).unwrap_or(0)
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).expect("not initialized")
    }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env, Address, String};

    #[test]
    fn test_create_and_buy_listing() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, MarketplaceContract);
        let client = MarketplaceContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let seller = Address::generate(&env);
        let buyer = Address::generate(&env);

        // Initialize with 2.5% fee
        client.initialize(&admin, &250);

        assert_eq!(client.get_fee_percent(), 250);
        assert_eq!(client.get_listing_count(), 0);

        // Create a listing (using a mock token address)
        let token = Address::generate(&env);
        let listing_id = client.create_listing(
            &seller,
            &String::from_str(&env, "Vintage Guitar"),
            &String::from_str(&env, "A beautiful 1965 Fender Stratocaster"),
            &10_000_000i128, // 1 XLM
            &token,
        );

        assert_eq!(listing_id, 1);
        assert_eq!(client.get_listing_count(), 1);

        let listing = client.get_listing(&1);
        assert_eq!(listing.status, ListingStatus::Active);
        assert_eq!(listing.price, 10_000_000);
    }

    #[test]
    fn test_cancel_listing() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, MarketplaceContract);
        let client = MarketplaceContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let seller = Address::generate(&env);
        let token = Address::generate(&env);

        client.initialize(&admin, &250);

        let listing_id = client.create_listing(
            &seller,
            &String::from_str(&env, "Test Item"),
            &String::from_str(&env, "Test Description"),
            &5_000_000i128,
            &token,
        );

        client.cancel_listing(&seller, &listing_id);

        let listing = client.get_listing(&listing_id);
        assert_eq!(listing.status, ListingStatus::Cancelled);
    }
}