from typing import Mapping, List, Dict, Tuple, Any
import os
from http_daemon import delay_open_url, serve_pages

def make_ajax_page(params: Mapping[str, Any]) -> Mapping[str, Any]:
    print(f'make_ajax_page was called with {params}')
    if params['action'] == 'move':
        player = find_player(params['id'])
        player.x = params['x']
        player.y = params['y']
        updates.append(player)
    elif params['action'] == 'update':
        player = find_player(params['id'])
        remaining_updates = updates[player.updatepos:]
        player.updatepos = len(updates)

        #jsonify updates
        jsonupdates: List[Tuple[str, int, int]] = []
        for i in range(len(remaining_updates)):
            player = remaining_updates[i]
            jsonupdates.append((player.player_id, player.x, player.y))

        return {
            "updates" : jsonupdates
        }
    elif params['action'] == 'load':
        #create player
        player = find_player(params['id'])
        player.x = params['x']
        player.y = params['y']
        updates.append(player)

        #request all updates
        remaining_updates = updates[0:]
        player.updatepos = len(updates)

        # jsonify updates
        json_updates: List[Tuple[str, int, int]] = []
        for i in range(len(remaining_updates)):
            player = remaining_updates[i]
            json_updates.append((player.player_id, player.x, player.y))

        return {
            "updates": json_updates
        }
    return {
        "recieved" : "sure"
    }

def find_player(id: str) -> Any:
    if id not in players:
        players[id] = Player(id)
    return players[id]

class Player:
    def __init__(self, id: str):
        self.player_id = id
        self.x = 50
        self.y = 50
        self.updatepos = 0

#dictionary of players & update point
players:Dict[str, Player] = {}
#list of updates
updates:List[Player] = []

def main() -> None:
    # Get set up
    os.chdir(os.path.join(os.path.dirname(__file__), '../front_end'))

    # Serve pages
    port = 8987
    delay_open_url(f'http://localhost:{port}/game.html', .1)
    serve_pages(port, {
        'ajax.html': make_ajax_page,
    })

if __name__ == "__main__":
    main()
