# 🛒 DecentraMarket — Soroban Smart Contract

> A trustless, permissionless decentralized marketplace built on the **Stellar** blockchain using **Soroban** smart contracts.

---

## 📖 Project Description

**DecentraMarket** is a peer-to-peer marketplace smart contract deployed on Stellar's Soroban platform. It allows any user to list items for sale, purchase listings using any Stellar Asset Contract (SAC) token (including native XLM), and cancel their own listings — all without relying on a central authority. A small configurable platform fee is collected on each successful sale, with admin-controlled withdrawal.

Built with `soroban-sdk v21`, the contract is designed to be minimal, auditable, and gas-efficient, leveraging Soroban's persistent/instance storage model and native token interface.

---

## ⚙️ What It Does

The contract enables a complete marketplace lifecycle:

1. **Admin deploys** the contract with a platform fee (e.g., 2.5%)
2. **Sellers** create listings with a title, description, price, and accepted token
3. **Buyers** purchase active listings — tokens are automatically transferred peer-to-peer, minus the platform fee
4. **Sellers** can cancel their own active listings at any time
5. **Admin** can withdraw accumulated fees and update the fee rate

All state transitions emit on-chain **events** for easy indexing by frontend applications.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🏷️ **Create Listings** | Any wallet can list an item with a price in XLM or any SAC token |
| 💸 **Buy Listings** | Atomic token transfer from buyer to seller on purchase |
| ❌ **Cancel Listings** | Sellers can delist active items at any time |
| 🔒 **Authorization** | All state-changing calls require Soroban `require_auth()` |
| 💰 **Platform Fees** | Configurable fee in basis points (max 10%), accrued per sale |
| 🛡️ **Admin Controls** | Fee withdrawal and fee-rate updates restricted to admin |
| 📡 **On-Chain Events** | `created`, `sold`, `cancel` events published for indexers |
| 🧪 **Unit Tests** | Full test suite using `soroban-sdk` testutils and `mock_all_auths` |
| ⚡ **Gas Efficient** | Uses `persistent` storage for listings, `instance` storage for config |

---

## 📂 Project Structure

```
soroban-marketplace/
├── Cargo.toml          # Rust dependencies & build profile
└── src/
    └── lib.rs          # Smart contract (all logic in one file)
```

---

## 🚀 Getting Started

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WASM target
rustup target add wasm32-unknown-unknown

# Install Stellar CLI
cargo install --locked stellar-cli --features opt
```

### Build

```bash
stellar contract build
```

Output: `target/wasm32-unknown-unknown/release/soroban_marketplace.wasm`

### Run Tests

```bash
cargo test --features testutils
```

### Deploy to Testnet

```bash
# Configure identity
stellar keys generate --global alice --network testnet

# Deploy
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/soroban_marketplace.wasm \
  --source alice \
  --network testnet
```

### Initialize

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source alice \
  --network testnet \
  -- initialize \
  --admin <ADMIN_ADDRESS> \
  --fee_bps 250
```

---

## 📡 Contract Interface

### Write Functions

| Function | Auth Required | Description |
|---|---|---|
| `initialize(admin, fee_bps)` | — | One-time setup |
| `create_listing(seller, title, desc, price, token)` | `seller` | List a new item |
| `buy_listing(buyer, listing_id)` | `buyer` | Purchase a listing |
| `cancel_listing(seller, listing_id)` | `seller` | Delist an item |
| `withdraw_fees(token_address, recipient)` | `admin` | Withdraw platform fees |
| `update_fee(new_fee_bps)` | `admin` | Update the fee rate |

### Read Functions

| Function | Returns |
|---|---|
| `get_listing(id)` | Full `Listing` struct |
| `get_listing_count()` | Total listings ever created |
| `get_fee_percent()` | Current fee in basis points |
| `get_fee_balance()` | Accumulated fees (stroops) |
| `get_admin()` | Admin `Address` |

---

## 💡 Listing Data Structure

```rust
pub struct Listing {
    pub id: u64,
    pub seller: Address,
    pub title: String,
    pub description: String,
    pub price: i128,            // in stroops (1 XLM = 10_000_000)
    pub token_address: Address, // any SAC token
    pub status: ListingStatus,  // Active | Sold | Cancelled
    pub created_at: u64,        // ledger timestamp
}
```

---

## 🌐 Deployed Smart Contract

| Network | Contract ID |
|---|---|
| **Testnet** | https://stellar.expert/explorer/testnet/contract/CCMSWRNE67SDG354AXLL6X4SFQNFZSQRDCI5INMA2NCPO6QXZBDNQFEX |
| **Mainnet** | Coming soon |



---

## 🔭 Possible Extensions

- **Escrow mode** — hold funds in contract until buyer confirms delivery
- **Reputation system** — on-chain ratings per address
- **Offer / counter-offer** — negotiation before settlement
- **NFT listings** — support Soroban NFT standards
- **Search index** — off-chain indexer using Stellar Horizon event stream

---

## 📜 License

MIT © 2025 — Built with ❤️ on Stellar Soroban
