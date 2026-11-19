/**
 * 저작권 무료 배경음 10선 (2026-11-19 실제 페이지·다운로드 URL 확인).
 *
 * 모두 Pixabay Content License(무료 사용·수정 가능·출처 표기 불필요)이며,
 * 앱·영상의 배경음으로 쓸 수 있다. 단, 음원 파일을 단독으로 재배포(다운로드
 * 사이트·음원 라이브러리 형태)하는 것은 금지된다.
 *
 * 파일 크기가 커서(5~40MB) 저장소에 넣지 않고 Pixabay CDN 주소를 그대로
 * 재생한다. 나중에 오프라인 배포를 하려면 음원을 내려받아
 * `public/audio/bgm/`에 두고 `audioUrl`을 `/audio/bgm/<id>.mp3`로 바꾸면 된다.
 */
export type BgmTheme = "요가" | "자연" | "제3세계" | "우주";

export interface BgmTrack {
  id: string;
  title: string;
  artist: string;
  theme: BgmTheme;
  /** 재생 길이 (분:초) */
  duration: string;
  license: string;
  /** 출처 표기 여부 */
  attribution: string;
  /** 앱 배경음으로 쓸 수 있는지 (확인 결과) */
  appUse: string;
  pageUrl: string;
  audioUrl: string;
  note?: string;
}

export const BGM_TRACKS: BgmTrack[] = [
  {
    id: "morning-meditation",
    title: "Morning Meditation – Ambient Yoga Music",
    artist: "FASSounds",
    theme: "요가",
    duration: "5:44",
    license: "Pixabay Content License",
    attribution: "표기 불필요 (권장: FASSounds)",
    appUse: "가능 · 앱 배경음 OK",
    pageUrl:
      "https://pixabay.com/music/meditationspiritual-morning-meditation-ambient-yoga-music-247406/",
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2024/10/04/audio_68347974a5.mp3?filename=fassounds-morning-meditation-ambient-yoga-music-247406.mp3",
    note: "아침 시각화·3분 명상에 잘 맞는 맑은 앰비언트. Content ID 등록됨(유튜브용).",
  },
  {
    id: "yoga-relax",
    title: "Yoga Music relax",
    artist: "21415682",
    theme: "요가",
    duration: "20:01",
    license: "Pixabay Content License",
    attribution: "표기 불필요 (권장: 21415682)",
    appUse: "가능 · 앱 배경음 OK",
    pageUrl: "https://pixabay.com/music/meditationspiritual-yoga-music-relax-16182/",
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2022/02/01/audio_c4e5e245d2.mp3?filename=21415682-yoga-music-relax-16182.mp3",
    note: "20분 한 곡으로 20·30분 명상에 그대로 깔기 좋다. 싱잉볼+드론 패드.",
  },
  {
    id: "rain-solace",
    title: "Rain Solace (10 mins Yoga / Meditation)",
    artist: "NaturesEye",
    theme: "자연",
    duration: "10:01",
    license: "Pixabay Content License",
    attribution: "표기 불필요 (권장: NaturesEye)",
    appUse: "가능 · 앱 배경음 OK",
    pageUrl:
      "https://pixabay.com/music/meditationspiritual-rain-solace-10-mins-yoga-meditation-relaxation-2055/",
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2022/03/08/audio_cdfdd3fd68.mp3?filename=natureseye-rain-solace-10-mins-yoga-meditation-relaxation-2055.mp3",
    note: "빗소리+저음 패드. 10분 명상·비우기 시각화 기본값으로 적합.",
  },
  {
    id: "summer-rain",
    title: "Summer Rain Melody (20 minutes)",
    artist: "White_Records",
    theme: "자연",
    duration: "20:38",
    license: "Pixabay Content License",
    attribution: "표기 불필요 (권장: White_Records)",
    appUse: "가능 · 앱 배경음 OK",
    pageUrl:
      "https://pixabay.com/music/meditationspiritual-summer-rain-melody-background-for-meditation-and-yoga-20-minutes-314439/",
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2025/03/17/audio_f9f117d246.mp3?filename=white_records-summer-rain-melody-background-for-meditation-and-yoga-20-minutes-314439.mp3",
    note: "여름비+멜로디. 30분 코스·자유 타이머 배경음으로 길이가 넉넉하다.",
  },
  {
    id: "deep-forest",
    title: "Deep forest",
    artist: "PoshPony",
    theme: "자연",
    duration: "4:00",
    license: "Pixabay Content License",
    attribution: "표기 불필요 (권장: PoshPony)",
    appUse: "가능 · 앱 배경음 OK (AI 생성 표기 음원)",
    pageUrl: "https://pixabay.com/music/ambient-deep-forest-335081/",
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2025/05/01/audio_8263139b56.mp3?filename=poshpony-deep-forest-335081.mp3",
    note: "숲·에스닉 플루트·부드러운 타악. 페이지에 AI 생성 표기가 있어 스토어 등록 시 고지 여부를 확인한다.",
  },
  {
    id: "tibetan-bowls",
    title: "Tibetan bowls meditation",
    artist: "PatrizioYoga (Olistik Sound Project)",
    theme: "제3세계",
    duration: "4:13",
    license: "Pixabay Content License",
    attribution: "표기 불필요 (권장: PatrizioYoga)",
    appUse: "가능 · 앱 배경음 OK",
    pageUrl:
      "https://pixabay.com/music/meditationspiritual-tibetan-bowls-meditation-olistik-sound-project-patrizio-yoga-12046/",
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2021/12/12/audio_1423915e37.mp3?filename=patrizioyoga-tibetan-bowls-meditation-olistik-sound-project-patrizio-yoga-12046.mp3",
    note: "싱잉볼+물소리. 오묘한 제3세계 테마의 기본.",
  },
  {
    id: "hang-flute",
    title: "Soothing Hang and Flute Meditation Music",
    artist: "Silentvoice",
    theme: "제3세계",
    duration: "6:13",
    license: "Pixabay Content License",
    attribution: "표기 불필요 (권장: Silentvoice)",
    appUse: "가능 · 앱 배경음 OK",
    pageUrl:
      "https://pixabay.com/music/world-soothing-hang-and-flute-meditation-music-229157/",
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2024/08/02/audio_2b1e74a3c5.mp3?filename=silentvoice-soothing-hang-and-flute-meditation-music-229157.mp3",
    note: "행드럼+플루트. 자녀·가족 시각화, 소망 시각화에 따뜻하다.",
  },
  {
    id: "shamanic-forest",
    title: "Enchanted Forest – Shamanic Drums and Music",
    artist: "JuliusH",
    theme: "제3세계",
    duration: "4:01",
    license: "Pixabay Content License",
    attribution: "권장: JuliusH (제작자 요청: 자기 작품으로 사칭 금지)",
    appUse: "가능 · 앱 배경음 OK",
    pageUrl:
      "https://pixabay.com/music/meditationspiritual-enchanted-forest-shamanic-drums-and-music-1745/",
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2020/12/02/audio_ef844941f2.mp3?filename=juliush-enchanted-forest-shamanic-drums-and-music-1745.mp3",
    note: "샤머닉 드럼+플루트. 비우기 시각화의 '내려놓기' 구간에 어울린다.",
  },
  {
    id: "cosmic-exploration",
    title: "Cosmic Exploration",
    artist: "Universfield",
    theme: "우주",
    duration: "2:43",
    license: "Pixabay Content License",
    attribution: "표기 불필요 (권장: Universfield)",
    appUse: "가능 · 앱 배경음 OK",
    pageUrl: "https://pixabay.com/music/ambient-cosmic-exploration-387717/",
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2025/08/10/audio_18875aad44.mp3?filename=universfield-cosmic-exploration-387717.mp3",
    note: "넓게 열리는 우주 패드. 소망 시각화의 마지막 3분에.",
  },
  {
    id: "interstellar-light",
    title: "Beautiful Light Music_Interstellar",
    artist: "ComaStudio",
    theme: "우주",
    duration: "2:35",
    license: "Pixabay Content License",
    attribution: "표기 불필요 (권장: ComaStudio)",
    appUse: "가능 · 앱 배경음 OK",
    pageUrl: "https://pixabay.com/music/upbeat-beautiful-light-music-interstellar-120998/",
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2022/09/26/audio_3d84d15d5e.mp3?filename=comastudio-beautiful-light-music_interstellar-120998.mp3",
    note: "몽환적인 신스. 빛의 호수·미래의 나 시각화에.",
  },
];

export const BGM_BY_ID: Record<string, BgmTrack> = Object.fromEntries(
  BGM_TRACKS.map((track) => [track.id, track]),
);

export function bgmById(id: string | null | undefined): BgmTrack | null {
  if (!id) return null;
  return BGM_BY_ID[id] ?? null;
}
