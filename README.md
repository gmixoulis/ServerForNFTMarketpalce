# MetauServer

# Overview

The MetauServer serves as the backend for the Metaverse course offered by the University of Nicosia and supports
authorization and registration of users, as well as exam orchestration for the course.

# Deploying MetaUServer locally

For deploying the MetauServer locally:

- Create a new .env file under folder 'api' with the following structure:

```
DB_LOC='<part of db connection URL with format "mongodb+srv://<URL part>">'
DB_USER='<db username>'
DB_PASS='<db password>'
JWT_SECRET='<64-char long hex string>'
```

- Install dependencies
    - cd into `api`: `cd api`
    - run yarn to install dependencies: `yarn`
- Run the start script to start the server from within the 'api' folder: `yarn start`
- Access the endpoints through port `3000`: `http://localhost:3000/`
    - Example: `http://localhost:3000/user/register`

- Available endpoints:
    - `/user/register`, `POST`: Returns user nonce
        - Body: `{public_key}`
        - If
            - public key exists and token has not expired
            - public key exists but token has expired, update the nonce
            - public key does not exist, create a new user with the public key and new nonce
        - Returns error if failed to update nonce or insert user

    - `/user/signin`, `POST`: Returns generated user JWT using `update_at` time and expiration date one hour later
        - Body: `{public_key, domain, nonce, msg, signature}`
        - Return error if
            - retrieved public key using nonce does not match request public key (redirect)
            - no user is found for nonce
            - token has expired
            - generated `hash(domain, nonce, msg)` does not match signature

# Deploying dummy React client locally

- Install dependencies
    - cd into `client`: `cd client`
    - run yarn to install dependencies: `yarn`
- Run the start script to start the front end from within the 'client' folder: `yarn start`
- Access the front end through port `3006`: `https://localhost:3006`

# Architecture

---

TO BE FILLED

# Files description

---

TO BE FILLED

