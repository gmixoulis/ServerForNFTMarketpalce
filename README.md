# NFT Marketplace Backend API

## 🔗 Project Overview

**NFT Marketplace API** is a robust Node.js backend designed to power decentralized marketplaces. It acts as the bridge between the blockchain and the frontend, handling off-chain data (user profiles, metadata), authentication, and cloud storage integration.

## 🔑 Key Features

- **Security**: Authentication middleware (`authenticate.js`) ensuring secure API access.
- **Cloud Integration**: AWS Services integration (`aws_get_secret.js`, `s3-prefetch`) for secure secret management and media storage.
- **Microservices Ready**: Structured with Service-Repository pattern (`services/`, `routes/`) for scalability.
- **Database**: Integration with SQL/NoSQL databases via `db.js`.

## 🛠️ Tech Stack & Skills

- **Runtime**: Node.js
- **Framework**: Express.js
- **Cloud**: AWS (S3, Secrets Manager)
- **Architecture**: REST API, MVC Service Layer

## 💡 Innovation

While smart contracts handle transfers, a performant marketplace requires a powerful off-chain indexer and API. This project demonstrates **Backend System Design** skills, specifically tailored for the unique requirements of Web3 applications (speed, caching, and security).

## 🚀 Setup

```bash
yarn install
yarn start
```
