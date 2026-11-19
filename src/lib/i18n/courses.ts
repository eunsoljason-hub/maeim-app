import type { Course, GuideStep } from "@/lib/types";
import type { Lang } from "./dict";

interface LocalizedGuide {
  intent: string;
  steps: { label: string; line: string }[];
}

interface LocalizedCourse {
  title: string;
  subtitle: string;
  description: string;
  tag: string;
  guide?: LocalizedGuide;
}

/** 코스 카탈로그의 영문·일문 표기. 한국어는 constants.ts 원문을 쓴다. */
export const COURSE_I18N: Record<Exclude<Lang, "ko">, Record<string, LocalizedCourse>> = {
  en: {
    c3: {
      title: "3-Minute Reset",
      subtitle: "Come back to this moment",
      description:
        "Counting your breath right where you sit is enough. For three minutes, rest your attention on the inhale and the exhale, and let thoughts pass by.",
      tag: "Mindfulness",
    },
    c10: {
      title: "10-Minute Session",
      subtitle: "A breath to settle the day",
      description:
        "Choose one intention for the next ten minutes, then eight minutes of breathing and two minutes of quiet. Good after the kids are down, or before sleep.",
      tag: "Daily",
    },
    sleep: {
      title: "Sleep Breath",
      subtitle: "4-7-8 for falling asleep",
      description:
        "In for four, hold for seven, out for eight. Put the phone down before bed and let the breath slow on its own.",
      tag: "Sleep",
    },
    c20: {
      title: "20-Minute Session",
      subtitle: "Deep release · body scan",
      description:
        "Move through the body from your toes to your head, softening one place at a time. Less a longer session than a different kind of attention.",
      tag: "Deep release",
    },
    c30: {
      title: "30-Minute Deep Sit",
      subtitle: "Breath · body scan · silence",
      description:
        "Ten minutes of breath, fifteen of body scan, five of silence. For the nights when the house is finally quiet and you want to sit a while longer.",
      tag: "Long breath",
    },
    "vis-dawn": {
      title: "First Light",
      subtitle: "Five minutes before you get up",
      description:
        "With your eyes still closed, let the morning light pour slowly into your body. Five minutes to meet today's version of you before the day begins.",
      tag: "Morning",
    },
    "vis-light": {
      title: "Lake of Light",
      subtitle: "Filling your body with light",
      description:
        "Warm light enters at the crown of your head and travels down through your shoulders, chest, and all the way to your feet. Let it linger where you feel heavy.",
      tag: "Morning",
    },
    "vis-window": {
      title: "Morning Window",
      subtitle: "Seven minutes with a warm cup",
      description:
        "Sit by the window and watch the world begin to move. No rush — seven minutes to choose the pace of your day.",
      tag: "Morning",
    },
    vis: {
      title: "A Safe Room",
      subtitle: "Your own quiet room",
      description:
        "Close your eyes and picture a room that belongs only to you. Shut the door, choose the light, and let your breath settle.",
      tag: "Letting go",
    },
    "vis-river": {
      title: "The River That Carries",
      subtitle: "Setting thoughts on the water",
      description:
        "Lay each thought on a leaf and set it on the river. Don't hold on, don't push away — let it drift.",
      tag: "Letting go",
    },
    "vis-basket": {
      title: "The Letting-Go Basket",
      subtitle: "Setting down what you carried today",
      description:
        "Place everything you've been carrying into a basket. You can open it whenever you like. For now, you're just setting it down.",
      tag: "Letting go",
    },
    "vis-garden": {
      title: "Inner Garden",
      subtitle: "A walk through your own garden",
      description:
        "Open the gate and your garden is there. Plant one tree for what your heart needs today, and sit in its shade for a while.",
      tag: "Wish",
    },
    "vis-seed": {
      title: "Seed of a Wish",
      subtitle: "Live the day it has already happened",
      description:
        "Picture the morning when the thing you want has already come true. The air of that morning, your face, the first words you say.",
      tag: "Wish",
    },
    "vis-future": {
      title: "Meet Your Future Self",
      subtitle: "A conversation one year ahead",
      description:
        "The you of one year from now is waiting. What are they doing, and what have they set down?",
      tag: "Wish",
    },
    "vis-dawn-guide": { title: "", subtitle: "", description: "", tag: "" },
  },
  ja: {
    c3: {
      title: "3分のリセット",
      subtitle: "今この瞬間に戻る",
      description:
        "座ったままで、呼吸を数えるだけで十分です。3分間、吸って吐く息に注意を置き、考えは流れていくままに。",
      tag: "マインドフルネス",
    },
    c10: {
      title: "10分コース",
      subtitle: "一日を整える呼吸",
      description:
        "最初の30秒で今日の意図をひとつ決め、8分の呼吸と2分の静けさで終えます。子どもを寝かしつけたあとや、眠る前に。",
      tag: "毎日",
    },
    sleep: {
      title: "睡眠の呼吸",
      subtitle: "4-7-8で眠りへ",
      description:
        "4秒吸って、7秒止めて、8秒吐く。寝る前にスマホを置いて、ゆっくり呼吸してみましょう。",
      tag: "睡眠",
    },
    c20: {
      title: "20分コース",
      subtitle: "深いリリース · ボディスキャン",
      description:
        "つま先から頭まで、体の感覚をひとつずつ巡りながら力をゆるめます。長い瞑想というより、違う種類の注意です。",
      tag: "深いリリース",
    },
    c30: {
      title: "30分の深い瞑想",
      subtitle: "呼吸 · ボディスキャン · 静けさ",
      description:
        "10分の呼吸、15分のボディスキャン、5分の静けさ。家がようやく静かになった夜、もう少し長く座りたい日に。",
      tag: "長い呼吸",
    },
    "vis-dawn": {
      title: "朝の最初の光",
      subtitle: "起きる前の5分",
      description:
        "目を閉じたまま、窓から入る朝の光を体にゆっくり注ぎます。一日が始まる前に、今日の自分に会う5分。",
      tag: "朝",
    },
    "vis-light": {
      title: "光の湖",
      subtitle: "光で体を満たす",
      description:
        "頭のてっぺんから入った温かな光が、肩、胸を通って足先までゆっくり下りていきます。重い場所に光を留めて。",
      tag: "朝",
    },
    "vis-window": {
      title: "窓辺の朝",
      subtitle: "温かい一杯と7分",
      description:
        "窓辺に座り、世界が少しずつ動き出すのを眺めます。急がずに、今日の速度を決める7分。",
      tag: "朝",
    },
    vis: {
      title: "安全な部屋",
      subtitle: "自分だけの静かな部屋",
      description:
        "目を閉じて、自分だけの部屋を思い描きます。ドアを閉め、明かりを選び、呼吸を整える時間。",
      tag: "手放す",
    },
    "vis-river": {
      title: "流れに任せる川",
      subtitle: "考えを葉に乗せて流す",
      description:
        "浮かんだ考えを葉にひとつずつ乗せて川に流します。つかまえず、押しのけず、ただ流れていくままに。",
      tag: "手放す",
    },
    "vis-basket": {
      title: "手放すかご",
      subtitle: "今日抱えていたものを下ろす",
      description:
        "今日ずっと抱えていたものを、かごに入れていきます。かごはいつでも開けられます。今は少し下ろしておくだけ。",
      tag: "手放す",
    },
    "vis-garden": {
      title: "内なる庭",
      subtitle: "心の庭を歩く",
      description:
        "門を開けると、自分が手入れしてきた庭があります。今日の心に必要な木を一本植えて、その木陰に少し座ってみましょう。",
      tag: "願い",
    },
    "vis-seed": {
      title: "願いの種",
      subtitle: "叶った一日を先に生きる",
      description:
        "願いがすでに叶った朝を思い描きます。その朝の空気、表情、最初に口にする言葉まで。",
      tag: "願い",
    },
    "vis-future": {
      title: "未来の自分に会う",
      subtitle: "一年後の私との対話",
      description:
        "一年後の自分が、今のあなたを待っています。その人は何をしていて、何を手放したのでしょう。",
      tag: "願い",
    },
    "vis-dawn-guide": { title: "", subtitle: "", description: "", tag: "" },
  },
};

/** 시각화 가이드 스크립트의 영문·일문. 단계는 인덱스로 맞춘다. */
export const GUIDE_I18N: Record<Exclude<Lang, "ko">, Record<string, LocalizedGuide>> = {
  en: {
    "vis-dawn": {
      intent: "Fill your waking body with light, and choose one sentence to center the day.",
      steps: [
        { label: "Close your eyes", line: "Close your eyes and stay under the blanket a little longer. Listen to your body waking up." },
        { label: "Light arrives", line: "Morning light comes through the gap in the curtains. Rest it gently on your forehead." },
        { label: "Light travels down", line: "The light moves past your face, your neck, your shoulders. Your shoulders drop a little." },
        { label: "Three breaths", line: "Breathe in the light, breathe out last night's tiredness. Just three times." },
        { label: "One sentence", line: "Quietly decide one thing you will do today. One is enough." },
        { label: "Open your eyes", line: "Move your fingers and toes, then open your eyes slowly. You made it here today." },
      ],
    },
    "vis-light": {
      intent: "Find the heavy places and fill them with light, then carry that feeling into the day.",
      steps: [
        { label: "The lake surface", line: "Imagine standing on a still lake. The ground under your feet is soft as water." },
        { label: "Light at the crown", line: "A warm line of light touches the top of your head. The inside of your head brightens." },
        { label: "Into the shoulders", line: "Light spills down into your shoulders. Tight places soften as they hold it." },
        { label: "Chest and belly", line: "Through the chest, down to the belly. Let it linger where your heart has been tight today." },
        { label: "All the way down", line: "The light travels through your thighs, knees, and feet. Your toes feel warm." },
        { label: "Coming back", line: "Light surrounds your whole body. Hold that feeling and take three slow breaths." },
      ],
    },
    "vis-window": {
      intent: "Listen to the morning and choose the pace of your day yourself.",
      steps: [
        { label: "Sit by the window", line: "Sit by the window holding a warm cup. Feel the heat in your palms." },
        { label: "Sounds outside", line: "Count the sounds outside one by one. Birds, footsteps, a car passing far away." },
        { label: "The angle of light", line: "Trace how the light enters the room. It is moving, slowly." },
        { label: "Today's pace", line: "Ask yourself how you want to move today. Faster, or a little slower." },
        { label: "The first sip", line: "Take an imaginary first sip, and keep the first scene of today in your mind." },
      ],
    },
    vis: {
      intent: "Create a room with the door closed, and set today's tension down for a while.",
      steps: [
        { label: "At the door", line: "Imagine standing at the door of your room. Take the handle and open it slowly." },
        { label: "Close the door", line: "Step in and close the door. No one calls for you in here." },
        { label: "Choose the light", line: "Choose the light in the room. A warm lamp, a small candle, or moonlight." },
        { label: "Sit down", line: "Sit in the most comfortable place. Feel your back supported, the floor beneath you." },
        { label: "Today's weight", line: "Bring to mind the heaviest thing from today and set it down beside you." },
        { label: "Breathe", line: "Take one deep breath of the air in this room. You can open this door anytime." },
        { label: "Open the door", line: "Step out with a slightly lighter body. Only as much as you can today." },
      ],
    },
    "vis-river": {
      intent: "Practice letting thoughts pass without judging them.",
      steps: [
        { label: "By the river", line: "Imagine standing by a clear river. The sound of water is close." },
        { label: "One leaf", line: "You're holding a single leaf. Lay today's most persistent thought on it." },
        { label: "Set it down", line: "Lower the leaf onto the water. It floats for a moment, then drifts away." },
        { label: "One more", line: "When the next thought comes, lay it on another leaf. Anger and worry can go too." },
        { label: "Watch the river", line: "The river keeps moving and you are standing on the bank. That is enough." },
        { label: "Wash your hands", line: "Dip your hands in the water and lift them out. That's enough letting go for today." },
      ],
    },
    "vis-basket": {
      intent: "Put tasks and feelings into a visible basket and set them down for a while.",
      steps: [
        { label: "The basket", line: "Imagine a large basket in front of you. The lid is open." },
        { label: "Things to do", line: "Place everything you feel you must do today into the basket. All of it." },
        { label: "People", line: "Add the people you worry about, and words that linger. No judging, just placing." },
        { label: "Your feelings", line: "Add the hurt, the sorry, the tiredness. The heavier it is, the better the basket holds it." },
        { label: "Close the lid", line: "Close the lid and take one step back. It's okay to set this down for now." },
        { label: "Empty hands", line: "Your hands feel lighter. Keep this lightness with you today." },
      ],
    },
    "vis-garden": {
      intent: "Plant what your heart needs as a tree, and imagine it growing.",
      steps: [
        { label: "The garden gate", line: "Open the gate and a path you have tended appears. Breathe in the smell of earth." },
        { label: "What you need", line: "Ask what your heart needs most today. Rest, courage, or patience." },
        { label: "Choose a tree", line: "Choose a tree that resembles that need. A small sapling, or an old tree." },
        { label: "Plant it", line: "Dig the soil and plant the tree. Spread its roots and water it slowly." },
        { label: "Sit in the shade", line: "Sit beneath the tree. Imagine the sound of leaves growing." },
        { label: "Growing time", line: "This tree grows without being hurried. What you planted today is enough." },
        { label: "Close the gate", line: "Close the gate and come back. You can return whenever you need." },
      ],
    },
    "vis-seed": {
      intent: "Experience the specific scene of a wish already fulfilled, through your senses.",
      steps: [
        { label: "A single seed", line: "Rest a small seed in your palm. It is nothing yet, and it holds everything." },
        { label: "The morning after", line: "Picture the morning when the wish has come true. Where did you wake up?" },
        { label: "The first words", line: "What is the first thing you say that morning? Say it out loud if you like." },
        { label: "In your body", line: "How do your shoulders feel? Your chest? Let your body remember first." },
        { label: "Who is with you", line: "Think of who is in that scene. Look at their face." },
        { label: "Coming back", line: "Keep that feeling in your chest, and choose one very small step for today." },
      ],
    },
    "vis-future": {
      intent: "Talk with your future self and encourage the choices you are making now.",
      steps: [
        { label: "End of the hallway", line: "There is a door at the end of a long hallway. One year from now, you are behind it." },
        { label: "Open the door", line: "Open it, and there you are — a little more at ease. Take in that face slowly." },
        { label: "Their day", line: "What do they do in the morning, and in the evening? Picture their day." },
        { label: "What they set down", line: "What do they no longer do? What did they put down along the way?" },
        { label: "One question", line: "Quietly ask the one question you most want to ask them." },
        { label: "Listen", line: "Listen to their answer without rushing. Short is fine." },
        { label: "Hand in hand", line: "They take your hand and say, 'You can come slowly.'" },
      ],
    },
  },
  ja: {
    "vis-dawn": {
      intent: "目覚めた体を光で満たし、今日の中心になる一文を決めます。",
      steps: [
        { label: "目を閉じる", line: "目を閉じて、もう少し布団の中にいるとします。体が目覚めていく音を聞いてみましょう。" },
        { label: "光が入る", line: "カーテンの隙間から朝の光が入ってきます。その光を額にそっと置いてみましょう。" },
        { label: "光が下りる", line: "光は顔、首、肩へとゆっくり下りていきます。肩が少し下がります。" },
        { label: "三回の呼吸", line: "光を吸って、昨夜の疲れを吐き出します。三回だけで大丈夫。" },
        { label: "今日の一文", line: "今日はこれをしよう、と静かにひとつ決めます。ひとつで十分です。" },
        { label: "目を開ける", line: "指先と足先を少し動かして、ゆっくり目を開けます。今日もここまで来ました。" },
      ],
    },
    "vis-light": {
      intent: "体の重い場所を見つけて光で満たし、その感覚を一日へ持ち込みます。",
      steps: [
        { label: "湖の水面", line: "静かな湖の上に立っていると想像します。足もとは水のようにやわらかい。" },
        { label: "頭のてっぺんの光", line: "頭のてっぺんに温かな光がひとすじ触れます。頭の中が明るくなります。" },
        { label: "肩へ", line: "光が肩へ流れ落ちます。固まっていた肩が光を含んでほどけます。" },
        { label: "胸とお腹", line: "胸を通り、お腹へ。今日、心がこわばっていた場所に光を少し長く留めます。" },
        { label: "足先まで", line: "光は太もも、膝、足先まで下りていきます。足先が温かくなります。" },
        { label: "戻ってくる", line: "光が体全体を包んでいます。この感覚を覚えたまま、ゆっくり三回呼吸します。" },
      ],
    },
    "vis-window": {
      intent: "朝の音を聞き、今日の速度を自分で決めます。",
      steps: [
        { label: "窓辺に座る", line: "窓辺に座り、温かいカップを手に持ったとします。手のひらの温もりを感じます。" },
        { label: "外の音", line: "窓の外の音をひとつずつ数えます。鳥、足音、遠くを走る車。" },
        { label: "光の角度", line: "光が部屋に入る角度を目でなぞります。ゆっくり動いています。" },
        { label: "今日の速度", line: "今日はどんな速さで生きたいか、自分に聞いてみます。速く、あるいは少しゆっくり。" },
        { label: "最初の一口", line: "カップを一口飲むつもりで、今日の最初の場面を心に置きます。" },
      ],
    },
    vis: {
      intent: "ドアを閉じた安全な部屋をつくり、今日の緊張をしばらく下ろします。",
      steps: [
        { label: "ドアの前に", line: "自分の部屋のドアの前に立っていると想像します。取っ手を持ち、ゆっくり開けます。" },
        { label: "ドアを閉める", line: "中に入り、ドアを閉めます。この中では誰もあなたを呼びません。" },
        { label: "明かりを選ぶ", line: "部屋の明かりを選びます。温かいランプ、小さなろうそく、あるいは月明かり。" },
        { label: "床に座る", line: "いちばん心地よい場所に座ります。背中が支えられる感覚、床の温もりを感じます。" },
        { label: "今日の重さ", line: "今日いちばん重かったことをひとつ思い出し、横に下ろします。" },
        { label: "呼吸を整える", line: "部屋の空気を一度深く吸います。この部屋はいつでも開けられます。" },
        { label: "ドアを開ける", line: "少し軽くなった体でドアを開けて出ます。今日できる分だけで大丈夫。" },
      ],
    },
    "vis-river": {
      intent: "考えを判断せずに流していく練習。",
      steps: [
        { label: "川辺に立つ", line: "澄んだ川のほとりに立っていると想像します。水の音が近くにあります。" },
        { label: "葉を一枚", line: "手に葉を一枚持っています。今日いちばん浮かんだ考えを乗せてみましょう。" },
        { label: "水に浮かべる", line: "葉を水にそっと下ろします。しばらく浮かんで、流れていきます。" },
        { label: "もう一枚", line: "次の考えが来たら、また一枚に乗せます。怒りも心配もそのまま流します。" },
        { label: "川を眺める", line: "川は止まらずに流れ、私は岸に立っています。それだけで十分です。" },
        { label: "手を洗う", line: "水に手をつけてから上げます。今日はここまで流せば大丈夫。" },
      ],
    },
    "vis-basket": {
      intent: "やるべきことと感情を目に見えるかごに入れ、しばらく下ろしておきます。",
      steps: [
        { label: "かごを用意する", line: "目の前に大きなかごがひとつあると想像します。ふたは開いています。" },
        { label: "やるべきこと", line: "今日しなければと気にかかっていることを、ひとつずつ入れます。全部。" },
        { label: "人たち", line: "心配な人、気になる言葉も入れます。判断せず、入れるだけ。" },
        { label: "私の感情", line: "悲しさ、申し訳なさ、疲れも入れます。重いものほどかごはしっかり受け止めます。" },
        { label: "ふたを閉める", line: "ふたを閉めて一歩下がります。今は下ろしておいて大丈夫。" },
        { label: "空いた手", line: "両手が軽くなりました。この軽さを今日ひとつ覚えておきましょう。" },
      ],
    },
    "vis-garden": {
      intent: "今の心に必要なものを木として植え、育つ姿を想像します。",
      steps: [
        { label: "庭の門", line: "庭の門を開けると、手入れしてきた小道が見えます。土の匂いを一度吸います。" },
        { label: "今の心", line: "今日の心にいちばん必要なものは何か、聞いてみます。休息、勇気、あるいは待つこと。" },
        { label: "木を選ぶ", line: "その気持ちに似た木を選びます。小さな苗木でも、古い木でも。" },
        { label: "植える", line: "土を掘って木を植えます。根を広げ、水をゆっくり注ぎます。" },
        { label: "木陰に座る", line: "木陰に座ります。葉が育つ音を想像してみましょう。" },
        { label: "育つ時間", line: "この木は急かさなくても育ちます。今日植えたもので十分です。" },
        { label: "門を閉じる", line: "庭の門を閉じて戻ります。必要なときにまた来られます。" },
      ],
    },
    "vis-seed": {
      intent: "願いが叶ったあとの具体的な場面を、感覚で先に体験します。",
      steps: [
        { label: "種をひとつ", line: "手のひらに小さな種をひとつ乗せます。まだ何でもないけれど、すべてを抱いています。" },
        { label: "叶った朝", line: "その願いが叶った日の朝を思い描きます。どこで目を覚ましたのでしょう。" },
        { label: "最初のひとこと", line: "その朝、最初に口にする言葉は何ですか。声に出してもいいですよ。" },
        { label: "体の感覚", line: "そのとき肩はどんな感じでしょう。胸は。体に先に覚えてもらいましょう。" },
        { label: "誰といるか", line: "その場面に一緒にいる人を思い浮かべます。その人の顔を見ます。" },
        { label: "戻ってきて", line: "その感覚を胸に置いて、今日できるごく小さな一歩を決めます。" },
      ],
    },
    "vis-future": {
      intent: "未来の自分と対話し、今の選択を自分で励まします。",
      steps: [
        { label: "廊下の先", line: "長い廊下の先にドアがひとつあります。その向こうに一年後の自分がいます。" },
        { label: "ドアを開ける", line: "ドアを開けると、少し楽な表情の自分が立っています。その顔をゆっくり見ます。" },
        { label: "その人の一日", line: "その人は朝に何をし、夜に何をするでしょう。一日を描いてみます。" },
        { label: "手放したもの", line: "その人がもうやらないことは何でしょう。何を手放したのでしょう。" },
        { label: "ひとつの質問", line: "今の自分がその人に聞きたいことを、静かにひとつ尋ねます。" },
        { label: "答えを聞く", line: "その人の答えを急がずに聞きます。短くても大丈夫。" },
        { label: "手をつないで", line: "その人が手を握って「ゆっくり来ればいい」と言ってくれます。" },
      ],
    },
  },
};

export interface CourseText {
  title: string;
  subtitle: string;
  description: string;
  tag: string;
  guideIntent: string | null;
  guideSteps: { at: number; label: string; line: string }[] | null;
}

/** 선택한 언어의 코스 문구. 번역이 없으면 한국어로 자연스럽게 돌아간다. */
export function courseText(course: Course, lang: Lang): CourseText {
  if (lang === "ko") {
    return {
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      tag: course.tag,
      guideIntent: course.guide?.intent ?? null,
      guideSteps: course.guide?.steps ?? null,
    };
  }
  const base = COURSE_I18N[lang]?.[course.id];
  const guide = GUIDE_I18N[lang]?.[course.id];
  const steps = course.guide?.steps
    ? course.guide.steps.map((step: GuideStep, index: number) => {
        const tr = guide?.steps[index];
        return {
          at: step.at,
          label: tr?.label ?? step.label,
          line: tr?.line ?? step.line,
        };
      })
    : null;
  return {
    title: base?.title ?? course.title,
    subtitle: base?.subtitle ?? course.subtitle,
    description: base?.description ?? course.description,
    tag: base?.tag ?? course.tag,
    guideIntent: guide?.intent ?? course.guide?.intent ?? null,
    guideSteps: steps,
  };
}
