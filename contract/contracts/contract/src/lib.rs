#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Env, Symbol, String, Address, Vec};

#[derive(Clone)]
#[contracttype]
pub struct Item {
    pub id: u64,
    pub name: String,
    pub price: i128,
    pub seller: Address,
    pub sold: bool,
}

#[contract]
pub struct Marketplace;

#[contractimpl]
impl Marketplace {

    // Add item to marketplace
    pub fn list_item(env: Env, seller: Address, id: u64, name: String, price: i128) {
        seller.require_auth();

        let mut item = Item {
            id,
            name,
            price,
            seller: seller.clone(),
            sold: false,
        };

        env.storage().instance().set(&id, &item);
    }

    // Buy item
    pub fn buy_item(env: Env, buyer: Address, id: u64) {
        buyer.require_auth();

        let mut item: Item = env.storage().instance().get(&id).unwrap();

        if item.sold {
            panic!("Item already sold");
        }

        // NOTE: Token transfer logic would go here (using token contract)

        item.sold = true;
        env.storage().instance().set(&id, &item);
    }

    // Get item details
    pub fn get_item(env: Env, id: u64) -> Item {
        env.storage().instance().get(&id).unwrap()
    }
}