/* 
    ISSUE!: wildcard_display needs to switch back to main_display after using
                a wildcard. after testing some toggle switching, sometimes the game
                stalls after bot stands. another times, hitting/standing only works
                on wildcard_display and not main_display as it should.
*/



//  Constants
const INITIAL_POINTS: number = 15
const INITIAL_BET: number = 1

// Game variables
let blackjack_goal: number = 21

// Main display/screen "I don't know"s
let main_working: boolean = true

// Wildcard display variables
let wildcard_toggle: boolean = false
let wildcard_display_working: boolean = true
let pointer: number = 0

// Wildcard dependent variables
let previous_goals: number[] = [21]
let reveal_bot_hidden: boolean = false


// OLED Display
OLED12864_I2C.init(60)
OLED12864_I2C.on()

// Sound / Buzzer
music.setBuiltInSpeakerEnabled(false)
music.setVolume(255)

// 4-digit module
let my_tm = TM1637.create(DigitalPin.P1, DigitalPin.P2, 7, 4)
my_tm.on()
my_tm.showDP(1, true)


type Dictionary = {
    [key: string]: any;
}


function sum(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0);
}

function set(lst: any[]): any[] {
    let unique_items = []
    for (let item of lst) {
        if (unique_items.indexOf(item) < 0) {
            unique_items.push(item)
        }

    }
    return unique_items
}

function custom_shuffle(lst: number[]) {
    let j: number;
    let temp: number;
    let length = lst.length
    for (let i = length - 1; i > 0; --i) {
        j = randint(0, i)
        temp = lst[i]
        lst[i] = lst[j]
        lst[j] = temp
    }
}


// Player initialization
let player = {
    "name": "Player",
    "points": INITIAL_POINTS,
    "last_draw": 0,
    "standing": false,
    "invulnerable": false,
    "can_double_winnings": [false, false]
}

let player_hand: number[] = []
let player_wildcard_deck: Dictionary[] = []


// Bot initialization
let bot = {
    "name": "Bot",
    "points": INITIAL_POINTS,
    "last_draw": 0,
    "standing": false,
    "invulnerable": false,
    "can_double_winnings": [false, false]
}

let bot_hand: number[] = []
let bot_wildcard_deck: Dictionary[] = []

// Wildcard "table"
let placed_wildcards: Dictionary[] = []


let wildcards: Dictionary[] = [
    {
        "name": "Justice",
        "description": "Swap last drawn card with bot.",
    }
    , {
        "name": "Moon",
        "description": "Change blackjack goal to 17.",
    }
    , {
        "name": "Sun",
        "description": "Change blackjack goal to 24.",
    }
    , {
        "name": "Death",
        "description": "Removes opponent's last placed wildcard.",
    }
    , {
        "name": "Strength",
        "description": "Both players get a random wildcard.",
    }
    , {
        "name": "The Devil",
        "description": "Increase bet by 1.",
    }
    , {
        "name": "The Star",
        "description": "Decrease bet by 1.",
    }
    , {
        "name": "The Fool",
        "description": "Copy last placed wildcard for immediate use.",
    }
    , {
        "name": "The Magician",
        "description": "Return last drawn card to deck.",
    }
    , {
        "name": "Temperance",
        "description": "Replace all cards with the integer average",
    }
    , {
        "name": "The Tower",
        "description": "Decrease value of all cards by 2.",
    }
    , {
        "name": "The High Priestess",
        "description": "Cannot lose points this round.",
    }
    , {
        "name": "The Hierophant",
        "description": "Reveal opponent's hidden card.",
    }
    , {
        "name": "The Hanged Man",
        "description": "Sacrifice 2 points to double winning bet next round",
    }
]

function bot_decision_draw(deck: number[]) {

    // Hit if the sum of bot's hand is below 15
    if (sum(bot_hand) >= 15) {
        bot["standing"] = true
        console.log("Bot stands.")

    } else {
        bot_draw_card(deck)
        console.log("Bot hits.")
    }

}
function chance_get_wildcard(wildcard_deck: Dictionary[], player_user: boolean = true) {

    // No more than 4 wildcards
    if (wildcard_deck.length >= 4) {
        return
    }

    //  30% chance to get a wildcard on draw
    let new_wildcard: Dictionary;
    if (randint(0, 10) < 3) {
        new_wildcard = wildcards._pickRandom()
        wildcard_deck.push(new_wildcard)

        if (player_user) {
            console.log("You received a wildcard:" + new_wildcard["name"])
        } else {
            console.log("Bot received a wildcard: " + new_wildcard["name"])
        }

    }
}

function player_draw_card(deck: number[]) {
    let card: number;
    if (deck) {
        card = _py.py_array_pop(deck)
        player_hand.push(card)
        player["last_draw"] = card
        console.log("Player drew a card: " + card)

        chance_get_wildcard(player_wildcard_deck, true)
    }

}

function bot_draw_card(deck: number[]) {
    let card: number;

    if (deck) {
        card = _py.py_array_pop(deck)
        bot_hand.push(card)
        bot["last_draw"] = card
        console.log("Bot drew a card")
        chance_get_wildcard(bot_wildcard_deck, false)

    }

}

function reset_round() {
    player["last_draw"], bot["last_draw"] = 0

    player["standing"] = false
    player["invulnerable"] = false

    bot["standing"] = false
    bot["invulnerable"] = false

    reveal_bot_hidden = false

    wildcard_toggle = false
    wildcard_display_working = false


    blackjack_goal = 21

    placed_wildcards = []

    player_hand.splice(0, player_hand.length)
    bot_hand.splice(0, bot_hand.length)

    player["can_double_winnings"][1] = player["can_double_winnings"][0]
    bot["can_double_winnings"][1] = bot["can_double_winnings"][0]
}

function play_blackjack() {

    let deck: number[];

    let bet: number = INITIAL_BET

    OLED12864_I2C.clear()

    while (player["points"] > 0 && bot["points"] > 0) {

        console.log(`Bet: ${bet}`)

        deck = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
        custom_shuffle(deck)
        reset_round()

        basic.clearScreen()

        player_draw_card(deck)
        bot_draw_card(deck)

        console.log("Player hand (reset!):" + player_hand.join())
        console.log("Bot hand (reset!):" + bot_hand.join())



        message_screen(`New bet: ${bet}`, 1)

        while (!(player["standing"] && bot["standing"])) {

            //  HIT
            input.onButtonPressed(Button.A, function on_button_pressed_a() {
                if (main_working) {
                    wildcard_toggle = false
                    wildcard_display_working = false

                    if (player_hand.length > 4) {
                        message_screen("Hand full!")
                    } else {
                        player_draw_card(deck)
                        main_display()
                    }
                    music.play(music.tonePlayable(Note.C5, music.beat(BeatFraction.Half)), music.PlaybackMode.UntilDone)
                }
            })

            //  STAND
            input.onButtonPressed(Button.B, function on_button_pressed_b() {
                if (main_working) {
                    main_working = false
                    wildcard_toggle = false
                    wildcard_display_working = false

                    player["standing"] = true

                    music.play(music.tonePlayable(Note.C5, music.beat(BeatFraction.Half)), music.PlaybackMode.UntilDone)

                    chance_get_wildcard(player_wildcard_deck, true)

                    //  Bot draws from deck until stand (or specific condition)
                    while (!bot["standing"]) {

                        if (bot_hand.length > 4) {
                            break
                        }

                        bot_decision_draw(deck)
                        main_display()
                        basic.pause(500)
                        music.play(music.tonePlayable(Note.G5, music.beat(BeatFraction.Eighth)), music.PlaybackMode.UntilDone)
                    }

                    if (bot["standing"]) {
                        return
                    }
                }
            })



            if (player["standing"] && bot["standing"]) {
                wildcard_toggle = false
                break
            }

            // VIEW WILDCARDS
            if (wildcard_toggle) {

                control.inBackground(function () {

                    // Wildcard display // waypoint:1
                    wildcard_display_working = true
                    main_working = false
                    let value: any = wildcard_display()

                    console.log(typeof value === "string")
                    console.log("WHY!")
                    if (typeof value === "string") {
                        let { new_deck, new_bet } = wildcard_use(value, true, deck, bet)
                        deck = new_deck
                        bet = new_bet

                        console.log("Player hand:" + player_hand.join())
                        wildcard_toggle = false

                    }
                })

            } else {
                wildcard_display_working = false
                main_working = true
            }

            input.onPinPressed(TouchPin.P2, function () {
                wildcard_toggle = !wildcard_toggle
                main_working = !main_working
                console.log("Wildcard screen toggle: " + wildcard_toggle)

                if (!wildcard_toggle) {
                    console.log(`Player hand: ${player_hand.join()}`)
                }
            })

            basic.pause(1000)



        }

        // AFTER SINGLE ROUND // waypoint:3
        who_won(bet)
        bet++
        tube_module_show_points()

        console.log("Player hand:" + player_hand.join())
        console.log("Bot hand:" + bot_hand.join())
        print_sum_of_both_hand()

        basic.pause(3500)

        OLED12864_I2C.clear()
    }
    end_game()
    return
}

function wildcard_use(wildcard_name: string, player_user: boolean, deck: number[], bet: number) {
    // Player is user -> player_user = true
    // Bot is user -> player_user = false
    let place = () => {
        placed_wildcards.push({ "name": wildcard_name, "player_user": player_user })
        placed_wildcards.forEach(p => console.log(p["name"]))
    }

    function consume() {
        console.log("CONSUME!")
        if (player_user) {
            if (player_wildcard_deck.length == 0) {
                return
            }
            for (let i = player_wildcard_deck.length - 1; i >= 0; i--) {
                if (player_wildcard_deck[i]["name"] == wildcard_name) {
                    player_wildcard_deck.splice(i, 1);
                    console.log("PW " + player_wildcard_deck.forEach(p => console.log(p["name"])))
                    break
                }
            }
        } else {
            if (bot_wildcard_deck.length == 0) {
                return
            }
            for (let i = bot_wildcard_deck.length - 1; i >= 0; i--) {
                if (bot_wildcard_deck[i]["name"] == wildcard_name) {
                    bot_wildcard_deck.splice(i, 1);
                    console.log("BW " + bot_wildcard_deck.forEach(p => console.log(p["name"])))
                    break
                }
            }
        }
        // Kick drum
        music.play(
            music.createSoundExpression(
                WaveShape.Square,
                200, 1, 255, 0, 100,
                SoundExpressionEffect.None,
                InterpolationCurve.Curve),
            music.PlaybackMode.UntilDone)
    }

    console.log(wildcard_name)

    switch (wildcard_name) {
        case "Sun":
            // Set goal to 24.
            previous_goals.push(blackjack_goal)
            blackjack_goal = 24

            basic.showLeds(`
                        # . # . #
                        . # # # .
                        # # # # #
                        . # # # .
                        # . # . #
                        `)

            place()
            consume()

            message_splash("Sun!")
            message_splash("Go for" + blackjack_goal, 2)
            break
        case "Moon":
            // Set goal to 17.
            previous_goals.push(blackjack_goal)
            blackjack_goal = 17

            basic.showLeds(`
                        . # # # .
                        . . # # #
                        . . . # #
                        . . # # #
                        . # # # .
                        `)
            place()
            consume()
            message_splash("Moon!")
            message_splash("Go for " + blackjack_goal, 2)
            break
        case "Justice":
            // Swap last drawn cards in hand
            let temp: number = bot["last_draw"]
            bot["last_draw"] = player["last_draw"]
            player["last_draw"] = temp

            bot_hand.pop()
            bot_hand.push(bot["last_draw"])

            player_hand.pop()
            player_hand.push(player["last_draw"])

            basic.showLeds(`
                        . # . # .
                        # # # # #
                        . . # . .
                        . . # . .
                        . # # # .
                        `)
            message_splash("Justice!")
            message_splash("Swapped" + bot["last_draw"] + " & " + player["last_draw"], 2)
            place()
            consume()
            break
        case "Strength":
            // Both players get same random wildcard.
            // Insta-use.
            let new_wildcard: Dictionary = wildcards._pickRandom()

            if (player_user) {
                player_wildcard_deck.push(new_wildcard)
            } else {
                bot_wildcard_deck.push(new_wildcard)
            }

            basic.showLeds(`
                        . . . # .
                        . . # # .
                        . . # . .
                        . # # . .
                        . # . . .
                        `)

            message_splash("Strength!")
            message_splash(" + " + new_wildcard["name"], 2)
            consume()

            break
        case "The Devil":
            // Increment bet by 1.
            bet++
            basic.showLeds(`
                        # . . . #
                        # # . # #
                        . # # # .
                        . # . # .
                        . . # . .
                        `)

            message_splash("Devil!")
            message_splash(`Bet: ${bet}`, 2)
            place()
            consume()

            break
        case "The Star":
            // Decrement bet by 1.
            bet--
            basic.showLeds(`
                        . . # . .
                        . # # # .
                        # # . # #
                        . # # # .
                        . . # . .
                        `)

            message_splash("Star!")
            message_splash(`Bet: ${bet}`, 2)
            place()
            consume()

            break
        case "The Fool":
            // Copy last placed wildcard.
            // Cannot copy itself or nothing.
            // Insta-use (this card specifically)
            if (placed_wildcards.length == 0) {
                message_screen("Nothing to copy!")
                break
            }

            let latest_wildcard: string = placed_wildcards[placed_wildcards.length - 1]["name"]

            if (latest_wildcard == "The Fool") {
                // Disallow copying The Fool (prevents breaking the game)
                message_screen("Cannot copy!")
                break
            } else {
                basic.showLeds(`
                            . # . # .
                            . . . . .
                            . . # . .
                            # . . . #
                            . # # # .
                            `)

                music.play(
                    music.builtinPlayableSoundEffect(soundExpression.giggle),
                    music.PlaybackMode.UntilDone)
                consume()
                wildcard_use(latest_wildcard, player_user, deck, bet)
            }

            break
        case "The Magician":
            // Return last drawn card to deck.
            // Insta-use.
            if (player_user) {
                deck.push(player_hand.pop())
                message_splash(" -" + player["last_draw"], 2)
                player["last_draw"] = player_hand[player_hand.length - 1]

            } else {
                deck.push(bot_hand.pop())
                message_splash("Bot: -" + player["last_draw"], 2)
                bot["last_draw"] = bot_hand[bot_hand.length - 1]
            }
            // reshuffle deck
            custom_shuffle(deck)

            message_splash("Magician!")
            consume()
            break
        case "Death":
            // Removes last placed wildcard.
            // Insta-use.

            if (placed_wildcards.length == 0) {
                message_screen("Can't remove!")
                break
            }

            bet = death_wildcard(bet)

            basic.showLeds(`
                            # # # # #
                            # . # . #
                            # # # # #
                            . # . # .
                            . . . . .
                            `)
            message_splash("Death.")
            consume()
            break
        case "Temperance":
            // Replace all cards with the integer average
            // Insta-use.
            let average: number;
            let replace_with_average = (hand: number[]) => {
                average = Math.round(sum(hand) / hand.length)
                for (let i: number = 0; i <= hand.length - 1; ++i) {
                    hand[i] = average;
                }
            }

            if (player_user) {
                replace_with_average(player_hand)
            } else {
                replace_with_average(bot_hand)
            }

            basic.showLeds(`
                        # # # # #
                        # . . . #
                        . # . # .
                        . . # . .
                        . # # # .
                        `)

            message_splash("Temperance!")
            message_splash(`AVG: ${average}`, 2)
            consume()

            break
        case "The Tower":
            // Subtract two from all cards in hand.
            // Deletes cards 1 and 2 if in hand.
            // Insta-use.
            let subtract_two_from_all_cards = (hand: number[]) => {
                let new_hand: number[] = [];

                for (let card of hand) {
                    if (card > 2) {
                        new_hand.push(card - 2);
                    }
                }

                return new_hand;
            };

            if (player_user) {
                player_hand = subtract_two_from_all_cards(player_hand)

                message_splash(`PLR: -2`, 2)
            } else {
                bot_hand = subtract_two_from_all_cards(bot_hand)

                message_splash(`BOT: -2`, 2)
            }

            basic.showLeds(`
                        . . # . .
                        . # . # .
                        . # # # .
                        . # # # .
                        . # # # .
                        `)

            message_splash("Tower!")
            consume()
            break
        case "The High Priestess":
            // Cannot lose points this round.
            if (player_user) {
                player["invulnerable"] = true
                message_splash("PLR: SAFE", 2)
            } else {
                bot["invulnerable"] = true
                message_splash("BOT: SAFE", 2)
            }

            basic.showLeds(`
                        # . . . #
                        # . # . #
                        # # # # #
                        # . # . #
                        # . # . #
                        `)

            message_splash("HPriestess!")
            place()
            consume()
            break
        case "The Hierophant":
            // Reveal bot's hidden card.
            // Bot never draws this card!
            // Insta-use.

            if (!player_user) {
                // If bot were to somehow obtain and use
                // this card.
                message_splash("ERROR!")
                message_splash("BOT CHRT", 2)
                consume() // consume just to remove it
                break
            }

            reveal_bot_hidden = true

            basic.showLeds(`
                        . . # . .
                        . # # # .
                        . . # . .
                        # # # # #
                        . . # . .
                        `)

            message_splash("Hierophant!")
            consume()
            break
        case "The Hanged Man":
            // Sacrifice 2 points to double winning bet next round.
            // Does not get protected by "The High Priestess".
            // Insta-use.
            if (player_user) {
                player["points"] -= 2
                player["can_double_winnings"][0] = true
                message_splash("- Player", 2)
            } else {
                bot["points"] -= 2
                bot["can_double_winnings"][0] = true
                message_splash("- Bot", 2)
            }


            basic.showLeds(`
                . . # . .
                . . # . .
                . # # # .
                . . # . .
                . . . . .
                `)
            message_splash("Hanged Man!")
            consume()
            break
        default: // waypoint:2
            console.log("Card not found!: " + wildcard_name)
            message_splash("ERROR!")
            message_splash("INV CARD", 2)
            break
    }

    return {
        new_deck: deck,
        new_bet: bet
    }

}

function death_wildcard(bet: number): number {
    // Removes last placed wildcard.
    // Undoes effect of removed wildcard
    // Does NOT apply to insta-use wildcards

    if (placed_wildcards.length == 0) {
        message_splash("ERROR!")
        message_splash("INV DTH", 2)
        console.log("Error: Cannot use Death card!")
        return bet
    }

    let wildcard_to_remove: Dictionary = placed_wildcards[placed_wildcards.length - 1]
    // { "name": wildcard_name, "player_user": player_user }

    switch (wildcard_to_remove["name"]) {
        case "The Devil":
            // UNDO Increment bet by 1.
            bet--
            message_splash(`Bet: ${bet}`, 2)
            break
        case "The Star":
            // UNDO Decrement bet by 1.
            bet++
            message_splash(`Bet: ${bet}`, 2)
            break
        case "Sun":
            // UNDO Set goal to 24.
            blackjack_goal = previous_goals.pop()
            message_splash("Go for" + blackjack_goal, 2)
            break
        case "Moon":
            // UNDO Set goal to 17.
            blackjack_goal = previous_goals.pop()
            message_splash("Go for " + blackjack_goal, 2)
            break
        case "Justice":
            // UNDO Swap last drawn cards in hand (literally the same thing)
            let temp: number = bot["last_draw"]
            bot["last_draw"] = player["last_draw"]
            player["last_draw"] = temp

            bot_hand.pop()
            bot_hand.push(bot["last_draw"])

            player_hand.pop()
            player_hand.push(player["last_draw"])

            message_splash("Swapped" + bot["last_draw"] + " & " + player["last_draw"], 2)
            break

        case "The High Priestess":
            // UNDO Cannot lose points this round.
            if (wildcard_to_remove["player_user"]) {
                player["invulnerable"] = false
                message_splash("PLR: DNGR!", 2)
            } else {
                bot["invulnerable"] = false
                message_splash("BOT: DNGR!", 2)
            }

            break
        default:
            console.log("Death failed: " + wildcard_to_remove["name"])
            message_splash("ERROR!")
            message_splash("INV DTH", 2)
            break
    }


    return bet

}

function wildcard_display(): string | void {
    OLED12864_I2C.clear()

    if (!wildcard_display_working || !wildcard_toggle) {
        console.log("WAA!")
        return
    }

    if (pointer > player_wildcard_deck.length - 1) {
        pointer = player_wildcard_deck.length - 1
    } else if (pointer < 0) {
        // Should never occur but just for safety
        pointer = 0
    }

    let i: number = 0

    for (let card of player_wildcard_deck) {
        let card_name: string = card["name"]

        if (i == pointer) {
            console.log("> " + card_name)
        } else {
            console.log(card_name)
        }

        OLED12864_I2C.showString(2, i, card_name, 1)
        ++i
    }

    // Scroll up
    input.onGesture(Gesture.TiltRight, function () {
        if (!wildcard_display_working || !wildcard_toggle) {
            return
        }
        console.log("Pointer up")

        if (typeof redraw_pointer === 'function') {
            pointer--
            pointer = Math.constrain(pointer, 0, player_wildcard_deck.length - 1)
            redraw_pointer()
        }
    })

    // Scroll down
    input.onGesture(Gesture.TiltLeft, function () {
        if (!wildcard_display_working || !wildcard_toggle) {
            return
        }

        console.log("Pointer down")
        if (typeof redraw_pointer === 'function') {
            pointer++
            pointer = Math.constrain(pointer, 0, player_wildcard_deck.length - 1)
            redraw_pointer()
        }
    })

    // Select wildcard
    if (!wildcard_display_working || !wildcard_toggle || main_working) {
        return
    }

    WaitUntilBlocks.waitUntilButtonPressed(Button.A)

    if (!wildcard_display_working || !wildcard_toggle || main_working) {
        return
    }

    let selected_card: string | void

    if (wildcard_display_working) {
        if (!(player_wildcard_deck.length == 0)) {
            selected_card = player_wildcard_deck[pointer]["name"] // TODO:1
            wildcard_display_working = false
            wildcard_toggle = false // AAAAAAAAAAAAAAAA
        }
    }

    return selected_card
}
function who_won(bet: number) {

    function player_wins() {
        if (player["can_double_winnings"][1]) {
            player["points"] += (bet * 2)
            player["can_double_winnings"] = [false, false]
            message_splash("PLR: +2x bet!", 2)
        } else {
            player["points"] += bet
        }

        message_screen("The player!")

        if (!bot["invulnerable"]) {
            bot["points"] -= bet
        } else {
            message_splash("BOT: SAFE!", 3)
        }

        music._playDefaultBackground(
            music.builtInPlayableMelody(Melodies.PowerUp),
            music.PlaybackMode.InBackground)

    }

    function bot_wins() {
        if (bot["can_double_winnings"][1]) {
            bot["points"] += (bet * 2)
            bot["can_double_winnings"] = [false, false]
            message_splash("BOT: +2x bet!", 2)
        } else {
            bot["points"] += bet
        }

        message_screen("The bot!")

        if (!player["invulnerable"]) {
            player["points"] -= bet
        } else {
            message_splash("PLR: SAFE!", 3)
        }

        music.play(
            music.builtinPlayableSoundEffect(soundExpression.sad),
            music.PlaybackMode.InBackground)
    }

    // Prevent weird input glitches
    main_working = false
    wildcard_display_working = false
    wildcard_toggle = false

    // SUSPENSE...
    control.waitMicros(1000000) // 1.0s
    OLED12864_I2C.clear()

    OLED12864_I2C.showString(0, 1, "The winner", 1)
    OLED12864_I2C.showString(0, 2, "is...", 1)

    // snare roll that crescendos
    for (let volume = 1; volume <= 17; volume++) {

        music.play(music.createSoundExpression(
            WaveShape.Noise,
            588, 1, volume * 15, 0, 50,
            SoundExpressionEffect.Warble,
            InterpolationCurve.Linear),
            music.PlaybackMode.InBackground)

        basic.pause(20)
    }

    control.waitMicros(700000) // 0.7s

    // Calculate round winner

    let total_player_hand: number = sum(player_hand)
    let total_bot_hand: number = sum(bot_hand)

    if (total_player_hand > blackjack_goal) {
        if (total_bot_hand < blackjack_goal) {
            // Player loses if player busts and bot does not.
            console.log("You busted! Bot wins the round.")
            bot_wins()

        } else if (total_player_hand < total_bot_hand) {
            // Player wins if both busted, but player busts the least.
            console.log("You win the round!")
            player_wins()

        } else {
            // Player loses if both busted, but bot busts the least.
            console.log("Bot wins the round!")
            bot_wins()
        }

    } else if (total_player_hand > total_bot_hand) {
        // Neither busts, player wins if player's hand is more than bot's.
        console.log("You win the round!")
        player_wins()

    } else if (total_bot_hand > blackjack_goal) {
        // Player wins if bot busts and player does not.
        console.log("Bot busted! You win the round.")
        player_wins()

    } else if (total_player_hand == total_bot_hand) {
        // Tie game if both hands are equal.
        console.log("It's a tie!")
        music.play(
            music.builtinPlayableSoundEffect(soundExpression.giggle),
            music.PlaybackMode.InBackground)
        message_screen("Tie game!")

    } else {
        // Player loses if neither busts, but bot's hand is more than player's.
        console.log("Bot wins the round!")
        bot_wins()
    }

    console.log("Player points: " + player["points"])
    console.log("Bot points: " + bot["points"])


    let show_bot_total = "Bot had " + total_bot_hand

    OLED12864_I2C.showString(0, 3, show_bot_total, 1)
}

function print_sum_of_both_hand() {
    console.log("Sum of player hand: " + sum(player_hand))
    console.log("Sum of bot hand: " + sum(bot_hand))
}


function tube_module_show_points() {
    // max 99 because max double-digit numbers
    let player_points = Math.constrain(player["points"], 0, 99)
    let bot_points = Math.constrain(bot["points"], 0, 99)

    my_tm.showNumber(player_points * 100 + bot_points)
}

function message_splash(message: string, y_pos: number = 1) {
    // Shows a message on the OLED during gameplay.
    console.log(message)

    control.inBackground(function () {
        basic.pause(10)
        OLED12864_I2C.showString(0, y_pos, message, 1)
        basic.pause(2000)
        OLED12864_I2C.showString(0, y_pos, message, 0)
    })
}

function message_screen(message: string, y_pos: number = 1) {
    // Shows seperate screen message on the OLED.
    OLED12864_I2C.clear()
    basic.pause(10)
    OLED12864_I2C.showString(0, y_pos, message, 1)
    basic.pause(1000)
    OLED12864_I2C.clear()
}

function main_display() {

    OLED12864_I2C.clear()

    let card_to_display: string;
    let index: number = 0

    for (let card of player_hand) {
        card_to_display = " " + card
        OLED12864_I2C.showString(index * 2.7, 3, card_to_display, 1)
        index += 1
    }

    index = 0

    for (let bcard of bot_hand) {
        card_to_display = " " + bcard
        if (index || reveal_bot_hidden) {
            OLED12864_I2C.showString(index * 2, 0, card_to_display, 1) // INDEX MULTIPLIER MAYBE FIX!!!!!! -------------------
        } else {
            OLED12864_I2C.showString(index * 2, 0, "?", 1)
        }
        index += 1
    }
}

function redraw_pointer(): void {
    for (let i: number = 0; i >= 3; i++) {
        if (i == pointer) {
            OLED12864_I2C.showString(0, pointer, ">", 1)

        } else {
            OLED12864_I2C.showString(0, i, " ", 0)
        }
    }
}

function end_game() {
    // END GAME

    if (player["points"] > bot["points"]) {
        // Player wins
        OLED12864_I2C.showString(0, 0, "YOU WIN!", 1)
        console.log("PLAYER WINS!")
        music._playDefaultBackground(music.builtInPlayableMelody(Melodies.JumpUp),
            music.PlaybackMode.InBackground)
    } else {
        // Bot wins
        OLED12864_I2C.showString(0, 0, "YOU LOSE!", 1)
        console.log("PLAYER LOSES!")
        music._playDefaultBackground(
            music.builtInPlayableMelody(Melodies.Funeral),
            music.PlaybackMode.InBackground)
    }
    OLED12864_I2C.showString(0, 3, "Reset to play again.", 1)


    OLED12864_I2C.invert(true)

    tube_module_show_points()
    basic.pause(5000)




    // Deactivate screens & sounds
    basic.clearScreen()

    music.stopAllSounds()
    music.setVolume(0)

    my_tm.clear()
    my_tm.off()

    OLED12864_I2C.invert(false)
    OLED12864_I2C.clear()
    OLED12864_I2C.off()

    return
}


function main_menu() {
    OLED12864_I2C.showString(0, 0, "   ARCANA", 1)
    OLED12864_I2C.showString(0, 1, "  BLACKJACK", 1)
    OLED12864_I2C.showString(0, 3, "SHAKE to play", 1)
    OLED12864_I2C.invert(true)

    input.onGesture(Gesture.Shake, function () {
        console.log("shaked!")
        OLED12864_I2C.invert(false)
        OLED12864_I2C.clear()

        play_blackjack()
    })

}



main_menu()