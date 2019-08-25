# Miner.js

An open source voxel game in javascript that can be played in your browser. 

<a href="https://discord.gg/xQHPHgZ" align="center">
<img src="https://img.shields.io/discord/612114066873516032.svg?style=for-the-badge" />
</a>

## Disclaimer

:pushpin: This project is a work in progress. There are still a lot of features waiting to be implemented, and the game is far from being completed. 

Miner.js is not associated with Mojang or Minecraft in any sort of official capacity.

# Motivation

Having to open an additional app to play a game is sometimes too tiring. Therefore, I thought it'd be interesting to somehow implement Minecraft with javascript, essentially bringing the whole Minecraft game onto the web. This not only takes away the tedious process of installing the game, it also brings the entire game to players within a couple clicks.

# Screenshots

These are some screenshots taken directly from the project.

## Awesome Graphics

![](https://i.imgur.com/v3aR0E7.png)
*Screenshot taken with [paper-cut-resource-pack](http://www.9minecraft.net/paper-cut-resource-pack/)*

![](https://i.imgur.com/tEuhoBx.jpg)
*Screenshot taken with [paper-cut-resource-pack](http://www.9minecraft.net/paper-cut-resource-pack/)*

![](https://i.imgur.com/5dadkka.jpg)
*Screenshot taken with [paper-cut-resource-pack](http://www.9minecraft.net/paper-cut-resource-pack/)*

![](https://i.imgur.com/extPtZs.png)
*Screenshot taken with [paper-cut-resource-pack](http://www.9minecraft.net/paper-cut-resource-pack/)*

# Build Stack

Javascript.

## Frontend

- [three.js](https://threejs.org)
- [react.js](https://reactjs.org/)
- [react-router](https://github.com/ReactTraining/react-router)
- [apollo](https://www.apollographql.com/)

## Backend

- [prisma](https://www.prisma.io/docs/1.34/get-started/01-setting-up-prisma-new-database-TYPESCRIPT-t002/)
- [graphql-yoga](https://github.com/prisma/graphql-yoga)

## Authentication

- [bcryptjs](https://github.com/dcodeIO/bcrypt.js/)
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken#readme)

# Features

- Player registration
- Save worlds
- Database support

# Installation

Before cloning the repo or doing anything, be sure to install [docker](https://www.docker.com/) and [node](https://nodejs.org/en/) on your computer. After that, run the following commands:

```bash
# Install the prerequisite libraries
yarn global add prisma graphql-cli nodemon

# Clone the repository
git clone https://github.com/ian13456/mc.js.git

# Download packages for both server and client
yarn

# Export environment variables for prisma
# FOR WINDOWS
set PRISMA_MANAGEMENT_API_SECRET=my-secret
# FOR MAC/LINUX (recommend putting this into .bashrc)
export PRISMA_MANAGEMENT_API_SECRET=my-secret

# Start all services
yarn run init # only needed when running for the first time
yarn run start
```

After these commands, visit `localhost:3000`

# Note

:pushpin: Miner.js runs fastest on either Opera or Chrome.

# Sources

- [Resource Pack Used](http://www.9minecraft.net/paper-cut-resource-pack/)
- [Multiplayer Player Mesh](https://github.com/bs-community/skinview3d)
- [Home Page Panorama Library](https://pannellum.org)
