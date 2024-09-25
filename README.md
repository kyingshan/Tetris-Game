# Tetris-Game

### Overview
This project is a **classic Tetris game** built using **JavaScript** and **RxJS** (Reactive Extensions for JavaScript). The focus of this implementation is to demonstrate proficiency in **asynchronous programming** and **Functional Reactive Programming** (FRP) concepts.

### Features
- Classic Tetris gameplay with falling tetrominoes and clearing rows.
- Real-time interaction using **RxJS** for event streams.
- Use of **JavaScript asynchronous programming** for handling game logic and animations.
- **Functional Reactive Programming (FRP)** principles applied for managing game state and user interactions.

### How It Works
The core of the game revolves around reactive streams using RxJS. For example:

- Keypresses are handled using RxJS fromEvent to reactively capture the user's input.
- Game loop uses the interval operator to update the game state and move the tetrominoes down the grid.
- State management is purely functional, with each tick of the game producing a new game state based on the previous one.

### Learn More
To gain a deeper understanding of how to play the game and the design decisions behind this implementation, please refer to the [Detailed Project Overview PDF](./Report.pdf).