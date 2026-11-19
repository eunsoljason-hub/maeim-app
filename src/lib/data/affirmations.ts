/**
 * 인유 확언 기본 데이터 — 4개 세션 × 30문장 = 120문장 (한국어 + 영어).
 * 사용자는 이 문장을 수정·삭제할 수 있고, 새 세션을 만들어 직접 채울 수 있다.
 * 저장은 `lib/affirmations.ts`가 localStorage에 담당한다.
 */
export interface Affirmation {
  id: string;
  ko: string;
  en: string;
  ja: string;
}

export interface AffirmationSession {
  id: string;
  title: string;
  titleEn: string;
  titleJa?: string;
  emoji: string;
  /** 카드 위에 보이는 한 줄 소개. */
  description: string;
  descriptionEn?: string;
  descriptionJa?: string;
  /** 기본 제공 세션인지 (삭제·이름 변경 제한) */
  builtin: boolean;
  items: Affirmation[];
}

type Pair = [ko: string, en: string, ja: string];

/** 내면 허브·확언 탭에서 쓰는 순서. */
const POSITIVE: Pair[] = [
  ["나는 지금 이대로도 충분히 소중한 사람입니다.", "I am already enough, exactly as I am.", "私は今のままで、十分に大切な存在です。"],
  ["오늘의 나는 어제보다 조금 더 다정합니다.", "Today I am a little kinder than yesterday.", "今日の私は、昨日より少し優しい。"],
  ["나는 내 감정을 판단하지 않고 받아들입니다.", "I accept my feelings without judging them.", "私は自分の感情を判断せずに受け止めます。"],
  ["숨을 고르는 만큼 마음도 고르게 됩니다.", "As I steady my breath, my mind grows steady too.", "呼吸を整えるほど、心も整っていきます。"],
  ["나는 완벽하지 않아도 괜찮은 사람입니다.", "I do not have to be perfect to be worthy.", "完璧でなくても、私は大丈夫。"],
  ["나는 나에게 친절할 권리가 있습니다.", "I have the right to be kind to myself.", "私は自分に優しくする権利があります。"],
  ["오늘 나는 할 수 있는 만큼만 하겠습니다.", "Today I will do only what I can.", "今日はできる分だけで大丈夫。"],
  ["나는 실수에서 배우고 다시 일어납니다.", "I learn from mistakes and rise again.", "私は失敗から学び、また立ち上がります。"],
  ["나의 속도는 나만의 것이고, 그것으로 충분합니다.", "My pace is my own, and it is enough.", "私のペースは私のもの。それで十分です。"],
  ["나는 사랑받을 자격이 있는 사람입니다.", "I am worthy of love.", "私は愛される価値のある人間です。"],
  ["지금 이 순간의 나는 안전합니다.", "In this moment, I am safe.", "今この瞬間、私は安全です。"],
  ["나는 하루에 한 번, 나를 위해 멈출 수 있습니다.", "I can pause for myself once a day.", "一日に一度、自分のために立ち止まれます。"],
  ["나는 셀 수 없이 많은 날들을 견뎌낸 사람입니다.", "I have already survived countless days.", "私は数えきれない日々を生き抜いてきました。"],
  ["내 안에는 회복하는 힘이 있습니다.", "I carry the strength to recover within me.", "私の中には回復する力があります。"],
  ["나는 남과 비교하지 않고 나를 봅니다.", "I look at myself instead of comparing myself to others.", "人と比べず、私は私を見ます。"],
  ["나는 오늘 한 가지를 스스로 칭찬합니다.", "Today I will praise myself for one thing.", "今日はひとつ、自分を褒めます。"],
  ["나는 도움을 청할 수 있는 용기가 있습니다.", "I have the courage to ask for help.", "私は助けを求める勇気があります。"],
  ["나는 쉬는 시간을 죄책감 없이 가집니다.", "I rest without guilt.", "私は罪悪感なく休めます。"],
  ["나의 마음은 내가 돌볼 수 있습니다.", "I can take care of my own heart.", "私の心は、私が大切にできます。"],
  ["나는 오늘의 감정을 기록할 수 있습니다.", "I can write down what I feel today.", "今日の感情を書き留めることができます。"],
  ["나는 좋은 사람과 좋은 말을 나누며 삽니다.", "I share good words with good people.", "私は良い人と良い言葉を交わして生きています。"],
  ["나는 모르는 것을 모른다고 말할 수 있습니다.", "I can say that I do not know.", "わからないことは、わからないと言えます。"],
  ["나는 거절할 권리가 있고, 거절받아도 괜찮습니다.", "I may say no, and I am okay when others do.", "断る権利があり、断られても大丈夫。"],
  ["나는 지금 여기에 있습니다.", "I am here, now.", "私は今、ここにいます。"],
  ["나의 하루는 작은 것들로 이미 채워져 있습니다.", "My day is already filled with small things.", "私の一日は、小さなことですでに満ちています。"],
  ["나는 걱정을 잠시 내려놓고 쉴 수 있습니다.", "I can set worry down and rest.", "心配を少し下ろして休めます。"],
  ["나는 나를 믿을 수 있습니다.", "I can trust myself.", "私は自分を信じられます。"],
  ["나는 오늘의 나를 응원합니다.", "I cheer for who I am today.", "今日の私を応援します。"],
  ["나는 언제든 다시 시작할 수 있습니다.", "I can begin again at any time.", "いつでもまた始められます。"],
  ["나는 살아 있는 것만으로 충분히 가치 있습니다.", "Being alive is enough to make me worthy.", "生きているだけで、十分に価値があります。"],
];

const WEALTH: Pair[] = [
  ["나는 가치를 만들고, 그 가치만큼 받을 준비가 되어 있습니다.", "I create value and am ready to receive in equal measure.", "私は価値を生み出し、その分を受け取る準備ができています。"],
  ["돈은 나에게 안전하게 흐르는 도구입니다.", "Money is a tool that flows to me safely.", "お金は私に安全に流れる道具です。"],
  ["나는 작은 수입에도 감사하고, 그것을 더 크게 키웁니다.", "I am grateful for small income and help it grow.", "小さな収入にも感謝し、それを大きく育てます。"],
  ["나는 돈을 어떻게 쓸지 스스로 결정합니다.", "I decide for myself how to use money.", "お金の使い方は私が決めます。"],
  ["나는 필요한 만큼 벌고, 남는 만큼 나눕니다.", "I earn what I need and share what remains.", "必要な分を稼ぎ、残った分を分け合います。"],
  ["지출을 기록하는 만큼 돈의 흐름이 보입니다.", "As I record my spending, I see where money flows.", "支出を記録するほど、お金の流れが見えてきます。"],
  ["나는 가격을 부르는 일을 두려워하지 않습니다.", "I am not afraid to name my price.", "私は値段を告げることを恐れません。"],
  ["내 시간과 재능에는 값이 있습니다.", "My time and talent have value.", "私の時間と才能には値があります。"],
  ["나는 부자가 되는 것을 편안하게 받아들입니다.", "I accept becoming wealthy with ease.", "私は豊かになることを心地よく受け入れます。"],
  ["풍요는 남을 막는 일이 아니라 함께 커지는 일입니다.", "Abundance is not about holding others back; it grows together.", "豊かさは誰かを止めることではなく、共に育つこと。"],
  ["나는 오늘 100원에서 시작해도 부의 감각을 기릅니다.", "Even starting with 100 won today, I train my sense of wealth.", "今日100円からでも、豊かさの感覚を育てます。"],
  ["나는 나누되 내 몫을 먼저 챙깁니다.", "I give to others, yet I care for my own share first.", "分け合いながらも、自分の取り分を先に守ります。"],
  ["나는 재정을 세우고 천천히 부를 쌓습니다.", "I plan my finances and build wealth slowly.", "家計を整え、ゆっくり富を積み上げます。"],
  ["나는 감정이 아니라 계획으로 소비합니다.", "I spend by plan, not by emotion.", "感情ではなく計画で使います。"],
  ["돈에 대해 이야기하는 것이 부끄럽지 않습니다.", "Talking about money does not embarrass me.", "お金の話をすることは恥ずかしくありません。"],
  ["나는 새는 돈을 살피고 새는 곳을 고칩니다.", "I notice where money leaks and repair it.", "漏れているお金に気づき、漏れ口を直します。"],
  ["인맥은 나의 자산입니다.", "My relationships are my assets.", "人のつながりは私の資産です。"],
  ["나는 배움에 투자하고 그것이 돌아오는 것을 봅니다.", "I invest in learning and watch it return.", "学びに投資し、それが返ってくるのを見ます。"],
  ["나는 부를 두려워하지 않고 책임집니다.", "I do not fear wealth; I take responsibility for it.", "豊かさを恐れず、責任を持ちます。"],
  ["매일 한 번, 돈을 지키는 선택을 합니다.", "Each day I make one choice that protects my money.", "毎日一度、お金を守る選択をします。"],
  ["나는 월급 이상의 가치를 스스로 만들 수 있습니다.", "I can create value beyond my salary.", "給料以上の価値を自分で生み出せます。"],
  ["나는 풍요를 얻어도 소박함을 잃지 않습니다.", "Even in abundance, I keep my simplicity.", "豊かになっても、質素さを失いません。"],
  ["나의 이야기도 하나의 상품이 될 수 있습니다.", "My own story can become something of value.", "私の物語も、ひとつの価値になります。"],
  ["나는 시간을 팔지 않고, 시간이 일하게 만드는 법을 배웁니다.", "I learn to make time work, not only to sell my time.", "時間を売るだけでなく、時間が働く仕組みを学びます。"],
  ["나는 받을 때도 주는 사람처럼 자연스럽습니다.", "I receive as naturally as I give.", "受け取ることも、与えるのと同じくらい自然に。"],
  ["빚은 정직하게 마주하고 하나씩 정리합니다.", "I face debt honestly and clear it one step at a time.", "借金と正直に向き合い、ひとつずつ整理します。"],
  ["나는 오늘의 작은 수익을 축하합니다.", "I celebrate today's small earnings.", "今日の小さな収入を祝います。"],
  ["부는 내 가족을 지키는 방패가 됩니다.", "Wealth becomes a shield that protects my family.", "豊かさは家族を守る盾になります。"],
  ["나는 돈을 나의 편으로 만들고, 돈과 함께 삽니다.", "I make money my ally and live alongside it.", "お金を味方にして、お金と共に生きます。"],
  ["나는 풍요를 기대할 자격이 있고, 그 기대를 행동으로 옮깁니다.", "I deserve to expect abundance, and I turn that expectation into action.", "私は豊かさを期待する資格があり、その期待を行動に変えます。"],
];

const KIDS: Pair[] = [
  ["나는 아이에게 지금 이 순간을 온전히 줍니다.", "I give my child this very moment, fully.", "私は子どもに、今この瞬間をまるごと渡します。"],
  ["우리 아이는 사랑받기 위해 아무것도 증명할 필요가 없습니다.", "My child need not prove anything to deserve love.", "わが子は、愛されるために何も証明する必要がありません。"],
  ["나는 아이의 감정을 고치기 전에 먼저 들어줍니다.", "Before fixing my child's feelings, I listen first.", "子どもの気持ちを直す前に、まず聴きます。"],
  ["나는 아이보다 늦게 걷는 것도 괜찮습니다.", "It is okay to walk slower than my child.", "子どもよりゆっくり歩いても大丈夫。"],
  ["우리는 오늘 한 번 함께 웃을 것입니다.", "We will laugh together at least once today.", "今日、私たちは一度一緒に笑います。"],
  ["나는 아이에게 미안하다고 말할 수 있는 부모입니다.", "I am a parent who can say, \"I'm sorry.\"", "私は「ごめんね」と言える親です。"],
  ["아이의 속도는 아이의 것이고, 나는 그것을 존중합니다.", "My child's pace is theirs, and I respect it.", "子どものペースは子どものもの。私はそれを尊重します。"],
  ["나는 아이를 나의 기대가 아니라 아이로 봅니다.", "I see my child as themselves, not as my expectation.", "私は子どもを期待ではなく、子ども自身として見ます。"],
  ["잠든 얼굴을 보면, 오늘의 짜증이 작아집니다.", "Looking at my sleeping child, today's irritation shrinks.", "寝顔を見ると、今日のいらだちが小さくなります。"],
  ["우리 아이는 안전한 곳에 있습니다.", "My child is in a safe place.", "わが子は安全な場所にいます。"],
  ["나는 함께 있는 시간의 길이보다 밀도를 봅니다.", "I value the depth of our time together over its length.", "一緒にいる時間の長さより、濃さを見ます。"],
  ["나는 아이에게 고마움을 소리 내어 말합니다.", "I say thank you to my child out loud.", "子どもに「ありがとう」を声に出して伝えます。"],
  ["나는 오늘 아이를 한 번 안아줍니다.", "I hold my child once today.", "今日、子どもを一度抱きしめます。"],
  ["아이의 장난은 아이가 잘 자라고 있다는 신호입니다.", "My child's mischief is a sign they are growing well.", "子どものいたずらは、よく育っているしるしです。"],
  ["나는 두 아이를 공정하게 보려고 노력합니다.", "I try to see both of my children fairly.", "二人の子どもを公平に見ようと努めます。"],
  ["우리 가족은 완벽하지 않아도 서로의 자리입니다.", "Our family need not be perfect to belong to each other.", "家族は完璧でなくても、互いの居場所です。"],
  ["나는 아이 앞에서 숨을 고를 수 있습니다.", "I can steady my breath in front of my child.", "子どもの前でも、呼吸を整えられます。"],
  ["우리 아이는 자기 길을 찾아갈 힘을 이미 가지고 있습니다.", "My child already has the strength to find their own path.", "わが子は自分の道を見つける力を、もう持っています。"],
  ["나는 아이의 말을 끝까지 듣는 연습을 합니다.", "I practice hearing my child to the end.", "子どもの話を最後まで聴く練習をします。"],
  ["아이가 넘어져도, 나는 믿고 기다려 줄 수 있습니다.", "If my child falls, I can trust and wait.", "子どもが転んでも、信じて待てます。"],
  ["나의 돌봄은 아이에게 보이지 않아도 닿아 있습니다.", "My care reaches my child even when it is unseen.", "私の世話は、見えなくても子どもに届いています。"],
  ["아이와 함께한 하루도 기록할 가치가 있습니다.", "A day with my child is worth recording.", "子どもと過ごす一日も、記録する価値があります。"],
  ["나는 오늘 아이에게 \"괜찮아\"라고 한 번 말합니다.", "Today I will tell my child, \"It's okay.\"", "今日、子どもに一度「大丈夫だよ」と言います。"],
  ["우리 아이는 사랑으로 충분히 채워지는 존재입니다.", "My child is filled, fully, by love.", "わが子は愛で十分に満たされる存在です。"],
  ["나는 아이의 등을 토닥이며 오늘을 내려놓습니다.", "Patting my child's back, I set today down.", "子どもの背中をさすりながら、今日を下ろします。"],
  ["아이는 나의 스승이고, 나는 그 옆의 동행입니다.", "My child is my teacher; I am their companion.", "子どもは私の師であり、私はその隣の同行者です。"],
  ["나는 아이에게 자주 미소 짓습니다.", "I smile at my child often.", "子どもによく微笑みかけます。"],
  ["우리는 함께 자라고 있습니다.", "We are growing together.", "私たちは一緒に育っています。"],
  ["나는 아이의 잠든 숨소리에 감사합니다.", "I am grateful for my sleeping child's breath.", "子どもの寝息に感謝します。"],
  ["나는 아이에게 좋은 기억 하나를 만들어 줄 수 있습니다.", "I can make one good memory for my child.", "私は子どもに、良い記憶をひとつつくれます。"],
];

const VISION: Pair[] = [
  ["나는 내가 원하는 삶을 선명하게 그릴수록 그것에 가까워집니다.", "The more clearly I imagine the life I want, the closer it comes.", "望む人生を鮮やかに描くほど、それに近づきます。"],
  ["나는 1년 뒤의 나를 오늘부터 만나러 갑니다.", "Starting today, I go to meet the person I will be in a year.", "一年後の自分に、今日から会いに行きます。"],
  ["나는 두려움과 함께에도 앞으로 걸어갑니다.", "I walk forward even with fear beside me.", "恐れと一緒でも、前へ歩きます。"],
  ["복직은 나의 능력을 다시 꺼내는 시간입니다.", "Returning to work is a time to bring my abilities back out.", "復職は、私の力を再び取り出す時間です。"],
  ["나는 엄마이면서 동시에 일하는 사람입니다.", "I am a mother and also a working person.", "私は母であり、同時に働く人です。"],
  ["나는 내 이름으로 무언가를 만들어 갑니다.", "I build something in my own name.", "私は自分の名前で何かをつくっていきます。"],
  ["나의 작은 시도는 언젠가 큰 장면의 첫 장이 됩니다.", "My small attempts become the opening scene of something larger.", "小さな試みは、いつか大きな場面の最初の一章になります。"],
  ["나는 오늘 한 걸음, 내일 한 걸음을 믿습니다.", "I trust one step today and one step tomorrow.", "今日の一歩、明日の一歩を信じます。"],
  ["나는 돈과 시간과 마음을 내가 원하는 방향으로 배치합니다.", "I arrange money, time, and heart in the direction I choose.", "お金と時間と心を、私が望む方向に置きます。"],
  ["내 콘텐츠를 보는 누군가가 위로받습니다.", "Someone who sees my work is comforted.", "私のコンテンツを見る誰かが、慰められます。"],
  ["나는 내 이야기를 꺼내 놓을 용기를 냅니다.", "I find the courage to offer my story.", "私は自分の物語を差し出す勇気を出します。"],
  ["나는 배운 것을 실습으로 옮깁니다.", "I turn what I learn into practice.", "学んだことを実践に移します。"],
  ["나는 실패한 시도에서 다음 시도를 얻습니다.", "From each failed attempt, I gain the next one.", "失敗した試みから、次の試みを得ます。"],
  ["나는 완벽한 준비를 기다리지 않고 시작합니다.", "I begin without waiting to be perfectly ready.", "完璧な準備を待たずに始めます。"],
  ["나는 풍요로운 미래의 나를 상상하며 오늘의 결정을 고릅니다.", "Imagining my abundant future self, I choose today's decision.", "豊かな未来の自分を想像して、今日の決定を選びます。"],
  ["나는 원하는 삶의 속도를 스스로 정합니다.", "I set the pace of the life I want.", "望む人生の速度は、私が決めます。"],
  ["나는 나의 브랜드를 한 뼘씩 키웁니다.", "I grow my brand, inch by inch.", "私のブランドを少しずつ育てます。"],
  ["나는 사람들 앞에 서서 내 이야기를 할 수 있습니다.", "I can stand before people and tell my story.", "人の前に立ち、自分の物語を話せます。"],
  ["나는 배우는 사람에서 가르치는 사람으로 자랍니다.", "I grow from a learner into a teacher.", "学ぶ人から、教える人へと育ちます。"],
  ["나는 복직 뒤에도 나만의 프로젝트를 놓지 않습니다.", "Even after returning to work, I hold on to my own projects.", "復職後も、自分のプロジェクトを手放しません。"],
  ["나는 내가 만든 것으로 누군가의 하루를 돕습니다.", "Through what I create, I help someone's day.", "私がつくったもので、誰かの一日を助けます。"],
  ["나는 더 큰 기회를 받아들일 준비가 되어 있습니다.", "I am ready to receive bigger opportunities.", "より大きな機会を受け取る準備ができています。"],
  ["나는 하루를 설계하고, 일주일을 계획하고, 1년을 그립니다.", "I design my days, plan my weeks, and envision my year.", "一日を設計し、一週間を計画し、一年を描きます。"],
  ["나는 나의 몫의 자리까지 걸어가겠습니다.", "I will walk to the place that is mine.", "私の場所まで歩いていきます。"],
  ["지금의 이 연습이 미래의 장면을 만듭니다.", "This practice, now, creates the scene ahead.", "今のこの練習が、未来の場面をつくります。"],
  ["나는 흔들려도 다시 중심을 잡습니다.", "Even when shaken, I return to my center.", "揺れても、また中心に戻ります。"],
  ["나는 가족과 꿈을 같은 방에 둘 수 있습니다.", "I can keep family and dreams in the same room.", "家族と夢を、同じ部屋に置けます。"],
  ["나는 오늘의 나를 1년 뒤의 나에게 보내는 선물로 만듭니다.", "I make today a gift to the person I will be in a year.", "今日の私を、一年後の私への贈り物にします。"],
  ["나는 이미 그 길 위에 있습니다.", "I am already on that path.", "私はもう、その道の上にいます。"],
  ["그것을 이루어도 나는 나답게 남아 있을 것입니다.", "Even when it is achieved, I will remain myself.", "それを叶えても、私は私のままでいます。"],
];

function build(
  id: string,
  title: string,
  titleEn: string,
  titleJa: string,
  emoji: string,
  description: string,
  descriptionEn: string,
  descriptionJa: string,
  pairs: Pair[],
): AffirmationSession {
  return {
    id,
    title,
    titleEn,
    titleJa,
    emoji,
    description,
    descriptionEn,
    descriptionJa,
    builtin: true,
    items: pairs.map(([ko, en, ja], index) => ({
      id: `${id}-${index + 1}`,
      ko,
      en,
      ja,
    })),
  };
}

export const DEFAULT_SESSIONS: AffirmationSession[] = [
  build(
    "positive",
    "긍정확언",
    "Positive Affirmations",
    "肯定の言葉",
    "🌿",
    "지금의 나를 있는 그대로 받아들이는 30문장",
    "30 lines to accept yourself exactly as you are",
    "今の自分をそのまま受け止める30の言葉",
    POSITIVE,
  ),
  build(
    "wealth",
    "부의확언",
    "Wealth & Abundance",
    "豊かさの言葉",
    "💰",
    "돈과 풍요를 편안하게 받아들이는 30문장",
    "30 lines to welcome money and abundance with ease",
    "お金と豊かさを心地よく受け入れる30の言葉",
    WEALTH,
  ),
  build(
    "kids",
    "자녀와함께",
    "With My Children",
    "子どもと一緒に",
    "🧸",
    "아이와 나, 우리를 위한 30문장",
    "30 lines for my children and for us",
    "子どもと私、私たちのための30の言葉",
    KIDS,
  ),
  build(
    "vision",
    "비젼확언",
    "Vision & Future Self",
    "ビジョンの言葉",
    "🌌",
    "1년 뒤의 나를 그리는 30문장",
    "30 lines to picture the person I'll be in a year",
    "一年後の自分を描く30の言葉",
    VISION,
  ),
];

export const TOTAL_DEFAULT_AFFIRMATIONS = DEFAULT_SESSIONS.reduce(
  (sum, session) => sum + session.items.length,
  0,
);


/* ----------------------------- 언어별 선택 도우미 ----------------------------- */

export function sessionTitleFor(
  session: AffirmationSession,
  lang: "ko" | "en" | "ja",
): string {
  if (lang === "en") return session.titleEn || session.title;
  if (lang === "ja") return session.titleJa || session.titleEn || session.title;
  return session.title;
}

export function sessionDescriptionFor(
  session: AffirmationSession,
  lang: "ko" | "en" | "ja",
): string {
  if (lang === "en") return session.descriptionEn || session.description;
  if (lang === "ja") return session.descriptionJa || session.descriptionEn || session.description;
  return session.description;
}

export function affirmationTextFor(item: Affirmation, lang: "ko" | "en" | "ja"): string {
  if (lang === "en") return item.en;
  if (lang === "ja") return item.ja || item.en;
  return item.ko;
}
