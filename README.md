-----

# Dagvault Protocol

**The Sum of Secure Finance.**

Dagvault is a next-generation Multisig (Multi-Signature) Wallet factory designed for modern corporate governance. Unlike traditional 1-person-1-vote wallets, Dagvault uses **weighted percentage-based voting**, allowing companies to mirror their actual equity structure on-chain.

-----

## 🌟 Why Dagvault?

Traditional multisigs treat every owner equally. Dagvault recognizes that in a real company, the CEO, CTO, and Investors have different levels of authority.

  * **📊 Weighted Governance:** Assign voting power based on equity (e.g., CEO has 40%, Investors have 20%).
  * **⚡ Batch Execution:** Save up to 40% on gas fees by bundling multiple transfers (payroll, vendors) into a single transaction.
  * **🛡️ Abstracted Security:** Logic and Funds are separated. The **Controller** manages permissions, while a distinct **Vault** holds the assets.
  * **⏳ Timelocks:** Optional delay periods for sensitive transactions to prevent malicious takeovers.

-----

## 🚀 Features

  * **Dashboard:** Real-time view of treasury assets, recent activity, and pending proposals.
  * **Proposal System:** Easy-to-use interface to propose transfers, owner additions, or setting changes.
  * **Token Support:** Native Blockdag  and ERC20 token support.
  * **Mass Payouts:** Upload a CSV or manually input a list of addresses to send funds to 50+ people in one click.
  * **Dark Mode:** Fully responsive UI with built-in dark mode.

-----

## 🛠️ Tech Stack

  * **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
  * **UI Components:** Shadcn/UI, Lucide Icons
  * **Blockchain Interaction:** Ethers.js v6
  * **Smart Contracts:** Solidity (Factory, Controller, CompanyWallet patterns)
  * **Network:** Blockdag (Testnet)

-----

## 🏁 Getting Started

Follow these steps to run the Dagvault dashboard locally.

### Prerequisites

  * Node.js (v18 or higher)
  * MetaMask (or any Web3 wallet) installed in your browser
  * Some testnet Blockdag  on Blockdag 

### 1\. Clone the Repository

```bash
git clone https://github.com/jerydam/dagvault.git
cd dagvault
```

### 2\. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3\. Configure Environment

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Add your deployed Factory Contract address:

```env
NEXT_PUBLIC_FACTORY_ADDRESS="0x..." 
# (If you don't have one, deploy the Solidity contracts first)
```

### 4\. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) with your browser.

-----

## 📖 Usage Guide

### Creating a Treasury

1.  Click **"Create Treasury"** on the sidebar.
2.  Name your wallet (e.g., "Acme Corp Treasury").
3.  Add Owners, their Names, and their **Percentage** of voting power.
4.  Set the **Required Percentage** (e.g., 51% to pass a vote).
5.  Click Deploy.

### Sending Funds (Batch)

1.  Go to your Multisig Dashboard.
2.  Click **"New Transfer"**.
3.  Select **"Send to Many"**.
4.  Upload a CSV or paste a list of addresses.
5.  Submit the proposal. Other owners must now sign it to reach the required percentage.

-----

## 🏗️ Smart Contract Architecture

Dagvault uses a modular architecture to ensure security and upgradability.

| Contract | Description |
| :--- | :--- |
| **MultiSigFactory** | The "Main" contract. It deploys new instances of Controllers and Wallets and tracks them. |
| **MultiSigController** | Stores the list of owners, percentages, and handles the voting logic. It tells the Wallet when to move funds. |
| **CompanyWallet** | A dumb "Vault" contract that holds the Blockdag /Tokens. It only accepts commands from its specific Controller. |

-----

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

-----

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

-----
