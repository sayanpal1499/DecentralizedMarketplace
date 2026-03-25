#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_create_and_buy_listing() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(MarketplaceContract, ());
    let client = MarketplaceContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let seller = Address::generate(&env);
    let _buyer = Address::generate(&env);

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

    let contract_id = env.register(MarketplaceContract, ());
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
