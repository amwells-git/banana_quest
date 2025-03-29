# Banana Quest
Real-Time MMO sprite game enabling dynamic interactions and synchronized movements through client-server communication

## Technologies Used

### Front End
- HTML5 Canvas: Renders game graphics.
- JavaScript: Client-side scripting.
- AJAX: Asynchronus communication with server.

### Back End
- Python: Server-side logic.
- HTTP Daemon: Served webpages and handled AJAX requests.

## Real-Time Multiplayer Interaction
Players control their sprites using mouse clicks and keyboard inputs. The server facilitates real-time updates, allowing playres to see th emovement of others.

## Dynamic Sprite Movement:
Each sprite can move to a destination in response to click events or keyboard input. The movement is calculated using a step size and direction, providing a smooth adn dynamic experience.

## Client-Server Communication:
AJAX requests enable actions like sprite movement and updates. WebSocket connections are used for real-time updates, ensuring minimal latency.

## Sprite Rendering:
Sprites are rendered onto the HTML5 Canvas, creating an engaging visual experience which is updated in real-time to reflect the positions of all active sprites.
