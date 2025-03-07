# Constants
INITIAL_POINTS = 10
INITIAL_BET = 1

deck: List[number] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10]
blackjack_goal = 21  # Reset every round

bet = INITIAL_BET
OLED12864_I2C.init(60)
music.set_built_in_speaker_enabled(False)
music.set_volume(255)

my_tm = TM1637.create(DigitalPin.P1, DigitalPin.P2, 7, 4)
my_tm.on()


def win_round():
    music._play_default_background(music.built_in_playable_melody(Melodies.POWER_UP), music.PlaybackMode.IN_BACKGROUND)

toggle = 0
def change_toggle(toggle):
    global toggle
    if toggle == 0:
        pins.digital_write_pin(DigitalPin.P1, 1)
        pins.digital_write_pin(DigitalPin.P2, 0)
        pins.digital_write_pin(DigitalPin.P3, 0)
        toggle = 1
    elif toggle == 1:
        pins.digital_write_pin(DigitalPin.P1, 0)
        pins.digital_write_pin(DigitalPin.P2, 1)
        pins.digital_write_pin(DigitalPin.P3, 0)
        toggle = 2
    elif toggle == 2:
        pins.digital_write_pin(DigitalPin.P1, 0)
        pins.digital_write_pin(DigitalPin.P2, 0)
        pins.digital_write_pin(DigitalPin.P3, 1)
        toggle = 0
    print(toggle)


def round(n):
    n = n*1
    integer_part = int(n)  # Get the integer part
    decimal_part = n - integer_part  # Get the fractional part
    
    if decimal_part < 0.5:
        return integer_part  # Round down
    else:
        return integer_part + 1  # Round up

def sum(numbers):
    total = 0
    for n in numbers:
        total += n  # Ensure all inputs are converted to floats before summing
        
    return total
    

def len(lst):
    count = 0
    for _ in lst:
        count += 1
    return count

def set(lst):
    unique_items = []
    for item in lst:
        if item not in unique_items:
            unique_items.append(item)
    return unique_items

def custom_shuffle(lst: List[number]):
    length = len(lst)
    for i in range(length - 1, 0, -1):
        j = randint(0, i)
        temp  = lst[i]
        lst[i] = lst[j]
        lst[j] = temp

player = {
    "name": "Player",
    "points": INITIAL_POINTS,
    "last_draw": 0,
    "standing": False,
    "invulnerable": False,
}

player_hand: List[number] = []
player_wildcard_deck = [""]
player_placed_wildcards = []

bot = {
    "name": "Bot",
    "points": INITIAL_POINTS,
    "last_draw": 0,
    "standing": False,
    "invulnerable": False,
}

bot_hand: List[number] = []
bot_wildcard_deck = [""]
bot_placed_wildcards = []


wildcards = [
    {"name": "Justice", "description": "Swap last drawn card with bot."},
    {"name": "Moon", "description": "Change blackjack goal to 17."},
    {"name": "Sun", "description": "Change blackjack goal to 24."},
    {"name": "Death", "description": "Removes opponent's last wildcard."},
    {"name": "Strength", "description": "Both players get a random wildcard."},
    {"name": "The Devil", "description": "Increase bet by 1."},
    {"name": "The Star", "description": "Decrease bet by 1."},
    {"name": "The Fool", "description": "Copy opponent's last wildcard."},
    {"name": "The Magician", "description": "Return last drawn card to deck."},
    {"name": "Temperance", "description": "Average all hand cards."},
    {"name": "The Tower", "description": "Remove all 1s and 2s."},
    {"name": "The High Priestess", "description": "Cannot lose points this round."},
    {"name": "The Chariot", "description": "Reveal opponent's hidden card."},
    {"name": "The Lovers", "description": "Subtract 5 from hand."},
]

def bot_decision_draw(deck: List[int]):
    """known_cards = set(player_hand + bot_hand)
    
    remaining_deck = []
    for card in known_cards:
        if card not in deck:
            remaining_deck.append(card)
    
    n = 0
    for ncard in remaining_deck:
        if bot_hand + ncard > blackjack_goal:
            n += 1
    bust_chance = n / len(remaining_deck)

    """
    #if bot_wildcard_deck and randint(0, 10) < 3:
    #    pass
    if sum(bot_hand) >= 15:
        bot["standing"] = True
        print("Bot stands.")
    else:
        bot_draw_card(deck)
        print("Bot hits.")
    
    """
    if bust_chance < 0.4:
        bot_draw_card(deck)
        print("Bot hits.")
        return
    else:
        bot["standing"] = True
        print("Bot stands.")
        return
    """


def player_draw_card(deck: List[int]):
    if deck:
        card: any = deck.pop()
        player_hand.append(card)
        player["last_draw"]: number = card
        print(f"Player drew a card")

        if randint(0, 10) < 2:  # 20% chance to get a wildcard on draw
            new_wildcard: string = wildcards._pick_random()['name']
            player_wildcard_deck.append(new_wildcard)
            print(f"You received a wildcard:" + new_wildcard)

        if sum(player_hand) > blackjack_goal:
            print("Busted!")



def bot_draw_card(deck: List[int]):
    if deck:
        card: number = deck.pop()
        bot_hand.append(card)
        bot["last_draw"] = card
        print(f"Bot drew a card")

        if randint(0, 10) < 2:  # 20% chance to get a wildcard on draw
            new_wildcard: string = wildcards._pick_random()['name']
            bot_wildcard_deck.append(new_wildcard)
            print("Bot received a wildcard: " + new_wildcard)

def reset_hands():
    player["last_draw"] = 0
    bot["last_draw"] = 0

    player["standing"] = False
    bot["standing"] = False

    while len(player_hand) > 0:
        player_hand.pop()

    while len(bot_hand) > 0:
        bot_hand.pop()

    print(player_hand)
    print(bot_hand)
    print("Hands resetted!")

def play_blackjack():
    global blackjack_goal
    bet = 1
    in_playable_state = True
    while in_playable_state:
        print(bet)
        deck = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10]
        custom_shuffle(deck)

        reset_hands()

        player_draw_card(deck)
        bot_draw_card(deck)
        bot_draw_card(deck)

        while not (player["standing"] and bot["standing"]):
            # HIT
            def on_button_pressed_a():
            
                if len(player_hand) > 4:
                    message_screen("Hand full!")
                else:
                    player_draw_card(deck)

            input.on_button_pressed(Button.A, on_button_pressed_a)
                
            # STAND
            def on_button_pressed_b():
                player["standing"] = True

                if randint(0, 10) < 2:  # 20% chance to get a wildcard on draw
                    new_wildcard: string = wildcards._pick_random()['name']
                    print(f"You received a wildcard:" + new_wildcard)
                
                # Bot draws from deck until stand
                while not bot["standing"]:
                    bot_decision_draw(deck)
                    basic.pause(200)

            input.on_button_pressed(Button.B, on_button_pressed_b)
            
            basic.pause(1000)
            main_display()
            tube_module_show_points()

        bet += 1
        who_won()
        
        print(player_hand)
        print(bot_hand)
        asdf()

        basic.pause(2000)
        OLED12864_I2C.clear()



play_blackjack()

def who_won():
    if sum(player_hand) > blackjack_goal:
        print("You busted! Bot wins the round.")
        player["points"] -= bet
        bot["points"] += bet

        message_screen("Bot wins!")

    elif sum(bot_hand) > blackjack_goal:
        print("Bot busted! You win the round.")
        bot["points"] -= bet
        player["points"] += bet
        win_round()

        message_screen("Player wins!")
    else:
        if (sum(player_hand) > sum(bot_hand)):
            print("You win the round!")
            player["points"] += bet
            bot["points"] -= bet
            win_round()

            message_screen("Player wins!")
        elif sum(player_hand) == sum(bot_hand):
            print("It's a tie!")
            message_screen("Tie game!")
        else:
            print("Bot wins the round!")
            player["points"] -= bet
            bot["points"] += bet

            message_screen("Bot wins!")

    show_bot_total: str = "Bot had " + sum(bot_hand)
    OLED12864_I2C.show_string(0, 3, show_bot_total, 1)

def asdf():
    print(sum(player_hand))
    print(sum(bot_hand))

def tube_module_show_points():
    my_tm.show_number(player["points"] * 100 + bot["points"])

def message_screen(message: str):
    OLED12864_I2C.clear()
    basic.pause(10)
    OLED12864_I2C.show_string(0, 1, message, 1)
    basic.pause(1000)
    OLED12864_I2C.clear()


def main_display():
    index = 0
    for card in player_hand:
        card_to_display = " " + card
        OLED12864_I2C.show_string(index*2.7, 3, card_to_display, 1)

        index += 1
    
    index = 0
    for bcard in bot_hand:
        card_to_display = " " + bcard
        OLED12864_I2C.show_string(index*2.7, 0, card_to_display, 1)
        index += 1

def wildcard_display():
    i = 0
    for card in player_wildcard_deck:
        OLED12864_I2C.show_string(0, i, card['name'], 1)


def on_pin_pressed_p0():
    pass
input.on_pin_pressed(TouchPin.P1, on_pin_pressed_p0)