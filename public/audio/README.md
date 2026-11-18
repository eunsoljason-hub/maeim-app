# 명상 오디오 폴더

여기에 코스별 BGM·나레이션 파일을 두면 플레이어가 자동으로 재생합니다.

```
public/audio/c10.mp3   ← 10분 코스
public/audio/c20.mp3   ← 20분 코스
public/audio/vis.mp3   ← 시각화 명상
public/audio/sleep.mp3 ← 수면 호흡
```

1. 파일을 이 폴더에 넣거나 Cloudflare R2에 업로드하고 서명 URL을 사용하세요.
2. `src/lib/constants.ts`의 해당 코스 `audioUrl`을 `/audio/c10.mp3` 또는 R2 URL로 바꿉니다.
3. 파일이 없으면 WebAudio로 합성한 앰비언스(빗소리·파도·장작불)가 대신 재생됩니다.
4. 한 번 재생한 오디오는 서비스 워커가 캐시해 오프라인에서도 들을 수 있습니다.

> BGM은 아트리스트·에피데믹 등 라이선스 음원 또는 직접 녹음한 파일만 사용하세요.
> 128kbps m4a/mp3를 권장합니다.
