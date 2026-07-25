/**
 * A curated, bundled emoji and symbol set.
 *
 * Stored as `glyph|name|extra keywords` lines to keep the payload small and the
 * source readable. Everything ships with the page — no CDN, no fetch.
 */

export interface Glyph {
  char: string;
  name: string;
  keywords: string;
  group: string;
}

const DATA: Record<string, string> = {
  'Smileys & emotion': `
😀|grinning face|happy smile joy
😃|grinning face with big eyes|happy smile
😄|grinning face with smiling eyes|happy laugh
😁|beaming face with smiling eyes|grin
😆|grinning squinting face|laugh haha
😅|grinning face with sweat|relief nervous
🤣|rolling on the floor laughing|rofl lol
😂|face with tears of joy|lol crying laughing
🙂|slightly smiling face|smile
🙃|upside-down face|sarcasm irony
😉|winking face|wink flirt
😊|smiling face with smiling eyes|blush happy
😇|smiling face with halo|angel innocent
🥰|smiling face with hearts|love adore
😍|smiling face with heart-eyes|love crush
🤩|star-struck|amazed excited
😘|face blowing a kiss|kiss love
😗|kissing face|kiss
😋|face savoring food|yum tasty
😛|face with tongue|tongue silly
🤪|zany face|crazy goofy
🤨|face with raised eyebrow|skeptical suspicious
🧐|face with monocle|inspect examine
🤓|nerd face|geek glasses
😎|smiling face with sunglasses|cool
🥳|partying face|celebrate party
😏|smirking face|smug
😒|unamused face|meh annoyed
😞|disappointed face|sad
😔|pensive face|sad thoughtful
😟|worried face|concerned
😕|confused face|puzzled
🙁|slightly frowning face|sad
😣|persevering face|struggle
😖|confounded face|frustrated
😫|tired face|exhausted
😩|weary face|tired
🥺|pleading face|beg puppy eyes
😢|crying face|sad tear
😭|loudly crying face|sob bawl
😤|face with steam from nose|frustrated triumph
😠|angry face|mad
😡|enraged face|furious rage
🤬|face with symbols on mouth|cursing swearing
🤯|exploding head|mind blown shocked
😳|flushed face|embarrassed
🥵|hot face|heat sweating
🥶|cold face|freezing
😱|face screaming in fear|scream shock
😨|fearful face|scared
😰|anxious face with sweat|nervous
😥|sad but relieved face|phew
😓|downcast face with sweat|stressed
🤗|hugging face|hug
🤔|thinking face|think hmm
🤭|face with hand over mouth|oops giggle
🤫|shushing face|quiet secret
🤥|lying face|pinocchio liar
😶|face without mouth|speechless
😐|neutral face|blank
😑|expressionless face|blank
😬|grimacing face|awkward
🙄|face with rolling eyes|annoyed
😯|hushed face|surprised
😴|sleeping face|sleep zzz
🤤|drooling face|hungry
😪|sleepy face|tired
😷|face with medical mask|sick mask
🤒|face with thermometer|sick fever
🤕|face with head-bandage|hurt injured
🤢|nauseated face|sick gross
🤮|face vomiting|sick throw up
🥴|woozy face|dizzy drunk
😵|face with crossed-out eyes|dead dizzy
🤠|cowboy hat face|cowboy
🤡|clown face|clown
👻|ghost|halloween spooky
💀|skull|dead death
☠️|skull and crossbones|danger poison
👽|alien|ufo extraterrestrial
🤖|robot|bot ai android
💩|pile of poo|poop crap
🎃|jack-o-lantern|halloween pumpkin
😺|grinning cat|cat
😻|smiling cat with heart-eyes|cat love
🙈|see-no-evil monkey|monkey hide
🙉|hear-no-evil monkey|monkey
🙊|speak-no-evil monkey|monkey quiet
`,

  'People & gestures': `
👋|waving hand|wave hello bye
🤚|raised back of hand|stop
🖐️|hand with fingers splayed|five
✋|raised hand|stop high five
🖖|vulcan salute|spock star trek
👌|OK hand|ok perfect
🤌|pinched fingers|italian chef
🤏|pinching hand|small tiny
✌️|victory hand|peace two
🤞|crossed fingers|luck hope
🤟|love-you gesture|ily
🤘|sign of the horns|rock metal
🤙|call me hand|shaka hang loose
👈|backhand index pointing left|point left
👉|backhand index pointing right|point right
👆|backhand index pointing up|point up
👇|backhand index pointing down|point down
☝️|index pointing up|one point
👍|thumbs up|like approve yes lgtm
👎|thumbs down|dislike no
✊|raised fist|fist power
👊|oncoming fist|punch bump
🤛|left-facing fist|bump
👏|clapping hands|applause bravo
🙌|raising hands|celebrate praise
👐|open hands|hug
🤲|palms up together|pray offer
🤝|handshake|deal agreement
🙏|folded hands|pray thanks please
✍️|writing hand|write sign
💪|flexed biceps|strong muscle
🦾|mechanical arm|prosthetic robot
🧠|brain|smart think
👀|eyes|look watch see
👁️|eye|look
👶|baby|infant
🧒|child|kid
👩|woman|female
👨|man|male
🧑‍💻|technologist|developer programmer coder
👩‍💻|woman technologist|developer programmer
👨‍💻|man technologist|developer programmer
🕵️|detective|spy investigate
👮|police officer|cop
👷|construction worker|builder
🦸|superhero|hero
🧙|mage|wizard magic
🧑‍🚀|astronaut|space
💃|woman dancing|dance
🕺|man dancing|dance
🤦|person facepalming|facepalm
🤷|person shrugging|shrug idk
🙋|person raising hand|question volunteer
🙇|person bowing|sorry respect
`,

  'Animals & nature': `
🐶|dog face|puppy pet
🐱|cat face|kitten pet
🐭|mouse face|rodent
🐹|hamster|pet
🐰|rabbit face|bunny
🦊|fox|
🐻|bear|
🐼|panda|
🐨|koala|
🐯|tiger face|
🦁|lion|
🐮|cow face|
🐷|pig face|
🐸|frog|
🐵|monkey face|
🐔|chicken|
🐧|penguin|linux
🐦|bird|twitter
🦅|eagle|
🦉|owl|wisdom
🦇|bat|
🐺|wolf|
🐗|boar|
🐴|horse face|
🦄|unicorn|magic startup
🐝|honeybee|bee
🐛|bug|insect defect
🦋|butterfly|
🐌|snail|slow
🐞|lady beetle|ladybug bug
🐜|ant|
🕷️|spider|web
🦂|scorpion|
🐢|turtle|slow
🐍|snake|python
🦎|lizard|
🦖|T-Rex|dinosaur
🐙|octopus|
🦑|squid|
🦐|shrimp|
🦀|crab|rust
🐡|blowfish|
🐠|tropical fish|
🐟|fish|
🐬|dolphin|
🐳|spouting whale|docker
🐋|whale|
🦈|shark|
🐊|crocodile|
🐘|elephant|postgres
🦏|rhinoceros|
🐪|camel|perl
🦒|giraffe|
🐄|cow|
🐓|rooster|
🕊️|dove|peace
🌵|cactus|desert
🌲|evergreen tree|pine
🌳|deciduous tree|tree
🌴|palm tree|beach
🌱|seedling|sprout grow
🌿|herb|plant
☘️|shamrock|clover
🍀|four leaf clover|luck
🍁|maple leaf|canada autumn
🍂|fallen leaf|autumn
🌾|sheaf of rice|wheat
🌷|tulip|flower
🌹|rose|flower love
🌺|hibiscus|flower
🌻|sunflower|flower
🌼|blossom|flower
🌸|cherry blossom|sakura flower
🌞|sun with face|sunny
🌝|full moon face|moon
🌚|new moon face|moon
🌙|crescent moon|night
⭐|star|favourite
🌟|glowing star|sparkle
✨|sparkles|magic clean shiny
⚡|high voltage|lightning fast power
🔥|fire|hot lit flame
💧|droplet|water
🌊|water wave|ocean sea
❄️|snowflake|cold winter
☃️|snowman|winter
🌈|rainbow|pride
☀️|sun|sunny clear
⛅|sun behind cloud|partly cloudy
☁️|cloud|cloudy
🌧️|cloud with rain|rain
⛈️|cloud with lightning and rain|storm
🌪️|tornado|storm
🌫️|fog|mist
`,

  'Food & drink': `
🍏|green apple|fruit
🍎|red apple|fruit
🍐|pear|fruit
🍊|tangerine|orange fruit
🍋|lemon|fruit sour
🍌|banana|fruit
🍉|watermelon|fruit
🍇|grapes|fruit
🍓|strawberry|fruit
🫐|blueberries|fruit
🍒|cherries|fruit
🍑|peach|fruit
🥭|mango|fruit
🍍|pineapple|fruit
🥥|coconut|
🥝|kiwi fruit|
🍅|tomato|
🥑|avocado|
🍆|eggplant|aubergine
🥔|potato|
🥕|carrot|
🌽|ear of corn|
🌶️|hot pepper|spicy chilli
🥦|broccoli|
🧄|garlic|
🧅|onion|
🍄|mushroom|
🥜|peanuts|
🍞|bread|
🥐|croissant|
🥖|baguette bread|
🧀|cheese wedge|
🥚|egg|
🍳|cooking|fried egg breakfast
🥞|pancakes|breakfast
🧇|waffle|
🥓|bacon|
🍔|hamburger|burger
🍟|french fries|chips
🍕|pizza|
🌭|hot dog|
🥪|sandwich|
🌮|taco|
🌯|burrito|
🥙|stuffed flatbread|
🧆|falafel|
🥗|green salad|
🍝|spaghetti|pasta
🍜|steaming bowl|ramen noodles
🍲|pot of food|stew
🍛|curry rice|
🍣|sushi|
🍤|fried shrimp|
🍚|cooked rice|
🍥|fish cake with swirl|
🥠|fortune cookie|
🍦|soft ice cream|
🍰|shortcake|cake dessert
🎂|birthday cake|celebration
🧁|cupcake|
🍪|cookie|
🍫|chocolate bar|
🍬|candy|sweets
🍩|doughnut|donut
☕|hot beverage|coffee tea
🍵|teacup without handle|tea green
🧃|beverage box|juice
🥤|cup with straw|soda
🍺|beer mug|beer
🍻|clinking beer mugs|cheers
🍷|wine glass|wine
🥂|clinking glasses|cheers celebrate
🍸|cocktail glass|martini
🥃|tumbler glass|whisky
🧉|mate|
🍾|bottle with popping cork|champagne celebrate
`,

  'Travel & activity': `
⚽|soccer ball|football
🏀|basketball|
🏈|american football|
⚾|baseball|
🎾|tennis|
🏐|volleyball|
🏉|rugby football|
🎱|pool 8 ball|billiards
🏓|ping pong|table tennis
🏸|badminton|
🥅|goal net|
🏒|ice hockey|
🏹|bow and arrow|archery
🎣|fishing pole|
🥊|boxing glove|
🥋|martial arts uniform|
⛳|flag in hole|golf
⛸️|ice skate|
🎿|skis|
🛷|sled|
🏂|snowboarder|
🏄|person surfing|surf
🏊|person swimming|swim
🚴|person biking|cycle
🏆|trophy|win first
🥇|1st place medal|gold win
🥈|2nd place medal|silver
🥉|3rd place medal|bronze
🎯|bullseye|target dart goal
🎮|video game|gaming controller
🕹️|joystick|arcade
🎲|game die|dice random
🧩|puzzle piece|jigsaw
🎨|artist palette|art paint design
🎭|performing arts|theatre
🎪|circus tent|
🎤|microphone|sing podcast
🎧|headphone|music audio
🎵|musical note|music
🎶|musical notes|music
🎸|guitar|
🎹|musical keyboard|piano
🥁|drum|
🎺|trumpet|
🚗|automobile|car
🚕|taxi|
🚙|sport utility vehicle|suv car
🚌|bus|
🚑|ambulance|emergency
🚒|fire engine|
🚓|police car|
🛻|pickup truck|
🚚|delivery truck|shipping
🚜|tractor|farm
🏎️|racing car|fast
🏍️|motorcycle|
🛵|motor scooter|
🚲|bicycle|bike
🛴|kick scooter|
🚀|rocket|launch deploy ship fast
🛸|flying saucer|ufo
✈️|airplane|flight travel
🚁|helicopter|
🚂|locomotive|train
🚆|train|
🚇|metro|subway
🚢|ship|boat
⛵|sailboat|
🛶|canoe|
⚓|anchor|
🗺️|world map|map
🧭|compass|navigate direction
🏔️|snow-capped mountain|
🌋|volcano|eruption
🏕️|camping|tent
🏖️|beach with umbrella|holiday
🏝️|desert island|
🌅|sunrise|morning
🌆|cityscape at dusk|city
🌃|night with stars|city night
🌍|globe showing Europe-Africa|earth world
🌎|globe showing Americas|earth world
🌏|globe showing Asia-Australia|earth world
🗽|Statue of Liberty|new york
🗼|Tokyo tower|
🏰|castle|
🏠|house|home
🏢|office building|work
🏥|hospital|
🏦|bank|
🏫|school|
`,

  'Objects & work': `
💻|laptop|computer code work
🖥️|desktop computer|monitor
🖨️|printer|print
⌨️|keyboard|typing
🖱️|computer mouse|click
💾|floppy disk|save legacy
💿|optical disk|cd
📀|dvd|
🖲️|trackball|
💽|computer disk|minidisc
🧮|abacus|calculate
📱|mobile phone|smartphone
📲|mobile phone with arrow|call
☎️|telephone|call
📞|telephone receiver|call
📟|pager|
📠|fax machine|
🔋|battery|power charge
🪫|low battery|power
🔌|electric plug|power
💡|light bulb|idea insight
🔦|flashlight|torch
🕯️|candle|
🧯|fire extinguisher|incident
🛢️|oil drum|barrel
💸|money with wings|spend expensive
💵|dollar banknote|money
💳|credit card|payment
🧾|receipt|invoice billing
💰|money bag|revenue
⚖️|balance scale|law justice
🔧|wrench|fix tool config
🔨|hammer|build tool
⚒️|hammer and pick|build
🛠️|hammer and wrench|tools maintenance
⛏️|pick|mine
🪛|screwdriver|tool
🔩|nut and bolt|hardware
⚙️|gear|settings config engine
🧰|toolbox|tools
🧲|magnet|attract
🔬|microscope|science research
🔭|telescope|observe
📡|satellite antenna|signal network
💉|syringe|injection
🩺|stethoscope|health check
🚪|door|
🪟|window|
🛏️|bed|sleep
🧺|basket|laundry
🧹|broom|clean sweep
🧽|sponge|clean
🪣|bucket|
🔑|key|password access
🗝️|old key|legacy access
🔒|locked|secure private
🔓|unlocked|open public
🔐|locked with key|secure auth
🔏|locked with pen|signed
🛡️|shield|security protect
🔗|link|url chain
📎|paperclip|attach
🖇️|linked paperclips|attach
📌|pushpin|pin important
📍|round pushpin|location
✂️|scissors|cut
📏|straight ruler|measure
📐|triangular ruler|measure geometry
📋|clipboard|copy paste
📁|file folder|directory
📂|open file folder|directory
🗂️|card index dividers|organise
🗃️|card file box|archive database
🗄️|file cabinet|archive storage
🗑️|wastebasket|delete trash remove
📦|package|box shipping npm module
📫|closed mailbox with raised flag|mail
📧|e-mail|email message
📨|incoming envelope|mail
📤|outbox tray|send export
📥|inbox tray|receive import
📜|scroll|document license
📄|page facing up|document file
📃|page with curl|document
📑|bookmark tabs|
📊|bar chart|analytics metrics
📈|chart increasing|growth up metrics
📉|chart decreasing|loss down
🗒️|spiral notepad|notes
📝|memo|write note edit
📔|notebook with decorative cover|
📚|books|documentation learn
📖|open book|read docs
🔖|bookmark|save
🏷️|label|tag
📰|newspaper|news
🗞️|rolled-up newspaper|news
📸|camera with flash|photo screenshot
📷|camera|photo
🎥|movie camera|video film
📹|video camera|record
📽️|film projector|
🎬|clapper board|action film
📺|television|tv
📻|radio|
⏰|alarm clock|time wake
⏱️|stopwatch|timing benchmark
⏲️|timer clock|countdown
🕰️|mantelpiece clock|time
⌛|hourglass done|waiting timeout
⏳|hourglass not done|loading waiting
`,

  Symbols: `
❤️|red heart|love
🧡|orange heart|
💛|yellow heart|
💚|green heart|
💙|blue heart|
💜|purple heart|
🖤|black heart|
🤍|white heart|
💔|broken heart|
💯|hundred points|perfect score
✅|check mark button|done yes pass success
☑️|check box with check|done ticked
✔️|check mark|done yes
❌|cross mark|no fail error wrong
❎|cross mark button|no
⛔|no entry|forbidden blocked
🚫|prohibited|banned not allowed
⚠️|warning|caution careful
🚨|police car light|alert emergency incident
❗|exclamation mark|important
❓|question mark|help unknown
💬|speech balloon|comment chat
💭|thought balloon|thinking
🗯️|right anger bubble|
🔔|bell|notification alert
🔕|bell with slash|mute silence
📢|loudspeaker|announce
📣|megaphone|shout announce
🔊|speaker high volume|sound loud
🔇|muted speaker|mute
♻️|recycling symbol|reuse green
🔄|counterclockwise arrows|refresh sync retry
🔃|clockwise vertical arrows|reload
🔁|repeat|loop
🔂|repeat single|loop once
▶️|play button|start run
⏸️|pause button|
⏹️|stop button|
⏺️|record button|
⏭️|next track button|skip
⏮️|last track button|previous
⏩|fast-forward button|
🔀|shuffle tracks button|random
⬆️|up arrow|up
⬇️|down arrow|down
⬅️|left arrow|back
➡️|right arrow|forward next
↗️|up-right arrow|
↘️|down-right arrow|
🔼|upwards button|
🔽|downwards button|
➕|plus|add
➖|minus|subtract remove
➗|divide|
✖️|multiply|times
🟰|heavy equals sign|equal
♾️|infinity|forever
💲|heavy dollar sign|money
🔢|input numbers|digits
🔤|input latin letters|abc text
🔠|input latin uppercase|caps
🔡|input latin lowercase|
🆗|OK button|ok
🆕|NEW button|new
🆓|FREE button|free
🆙|UP button|upgrade
🔍|magnifying glass tilted left|search find
🔎|magnifying glass tilted right|search zoom
⚫|black circle|
⚪|white circle|
🔴|red circle|fail error stop
🟠|orange circle|warning
🟡|yellow circle|pending
🟢|green circle|pass ok success
🔵|blue circle|info
🟣|purple circle|
🟤|brown circle|
⬛|black large square|
⬜|white large square|
🟥|red square|
🟩|green square|
🟦|blue square|
🔶|large orange diamond|
🔷|large blue diamond|
🔸|small orange diamond|
▪️|black small square|bullet
▫️|white small square|
🔺|red triangle pointed up|increase
🔻|red triangle pointed down|decrease
💠|diamond with a dot|
🌐|globe with meridians|web internet i18n
Ⓜ️|circled M|metro
🅰️|A button blood type|
🆎|AB button blood type|
🈚|Japanese free of charge button|
㊗️|Japanese congratulations button|
🔰|Japanese symbol for beginner|
⚜️|fleur-de-lis|
🔱|trident emblem|
`,

  'Technical characters': `
←|leftwards arrow|arrow left
→|rightwards arrow|arrow right
↑|upwards arrow|arrow up
↓|downwards arrow|arrow down
↔|left right arrow|
⇐|leftwards double arrow|implies
⇒|rightwards double arrow|implies then
⇔|left right double arrow|iff equivalent
↵|return symbol|enter newline
⏎|return symbol|enter
⌘|command key|mac cmd
⌥|option key|mac alt
⇧|shift key|mac shift
⌃|control key|mac ctrl
⌫|delete backwards|backspace
⎋|escape key|esc
⇥|tab key|tab
±|plus-minus sign|tolerance
×|multiplication sign|times
÷|division sign|divide
≠|not equal to|neq
≈|almost equal to|approximately
≡|identical to|equivalent
≤|less-than or equal to|lte
≥|greater-than or equal to|gte
∞|infinity|
√|square root|radical
∑|n-ary summation|sum sigma
∏|n-ary product|product pi
∫|integral|
∂|partial differential|
∆|increment|delta change
∇|nabla|del gradient
∈|element of|in member
∉|not an element of|not in
⊂|subset of|
∪|union|
∩|intersection|
∀|for all|universal
∃|there exists|existential
¬|not sign|negation
∧|logical and|conjunction
∨|logical or|disjunction
⊕|circled plus|xor
°|degree sign|temperature
′|prime|minutes feet
″|double prime|seconds inches
µ|micro sign|
Ω|ohm sign|omega resistance
π|greek small letter pi|
α|greek small letter alpha|
β|greek small letter beta|
γ|greek small letter gamma|
δ|greek small letter delta|
ε|greek small letter epsilon|
θ|greek small letter theta|
λ|greek small letter lambda|lambda function
σ|greek small letter sigma|
τ|greek small letter tau|
φ|greek small letter phi|golden ratio
ψ|greek small letter psi|
ω|greek small letter omega|
€|euro sign|currency
£|pound sign|currency
¥|yen sign|currency
¢|cent sign|currency
₿|bitcoin sign|currency crypto
₹|indian rupee sign|currency
©|copyright sign|
®|registered sign|trademark
™|trade mark sign|
§|section sign|
¶|pilcrow sign|paragraph
†|dagger|footnote
‡|double dagger|
•|bullet|list item
·|middle dot|separator
…|horizontal ellipsis|dots
–|en dash|range
—|em dash|
‐|hyphen|
«|left double angle quote|guillemet
»|right double angle quote|guillemet
“|left double quotation mark|smart quote
”|right double quotation mark|smart quote
‘|left single quotation mark|
’|right single quotation mark|apostrophe
␣|open box|space visible
⌀|diameter sign|empty
№|numero sign|number
℅|care of|
✓|check mark|tick done
✗|ballot x|cross fail
★|black star|favourite
☆|white star|
☑|ballot box with check|
☐|ballot box|empty checkbox
♥|black heart suit|
♦|black diamond suit|
♠|black spade suit|
♣|black club suit|
♪|eighth note|music
♫|beamed eighth notes|music
☺|white smiling face|
☹|white frowning face|
`,
};

export const GLYPHS: Glyph[] = Object.entries(DATA).flatMap(([group, block]) =>
  block
    .trim()
    .split('\n')
    .map((line) => {
      const [char, name, keywords = ''] = line.split('|');
      return { char, name, keywords, group };
    })
    .filter((g) => g.char && g.name),
);

export const GROUPS = Object.keys(DATA);

/** Every representation the picker can copy. */
export type GlyphFormat = 'char' | 'codepoint' | 'entity' | 'js' | 'css';

export const codePoints = (char: string): string[] =>
  [...char].map((c) => `U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`);

export function formatGlyph(char: string, format: GlyphFormat): string {
  switch (format) {
    case 'codepoint':
      return codePoints(char).join(' ');
    case 'entity':
      return [...char].map((c) => `&#${c.codePointAt(0)};`).join('');
    case 'js':
      return [...char].map((c) => `\\u{${c.codePointAt(0)!.toString(16)}}`).join('');
    case 'css':
      return [...char].map((c) => `\\${c.codePointAt(0)!.toString(16)}`).join('');
    default:
      return char;
  }
}

/** The haystack the picker filters on — name plus keywords, lowercased. */
export const searchText = (g: Glyph) => `${g.name} ${g.keywords}`.toLowerCase();

export function searchGlyphs(query = '', group = ''): Glyph[] {
  const q = query.trim().toLowerCase();
  return GLYPHS.filter(
    (g) => (!group || g.group === group) && (!q || searchText(g).includes(q)),
  );
}
