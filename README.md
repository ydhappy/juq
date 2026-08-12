# juq

ChatGPT/Codex와 GitHub를 연동하여 프로젝트를 개발·검토·관리하기 위한 작업 저장소입니다.

## 기본 운영 방식

- 기본 브랜치: `main`
- 기능 개발 및 수정: 별도 브랜치에서 작업
- 변경 사항: Pull Request로 검토 후 병합
- 비밀키, 토큰, 비밀번호, 개인정보는 커밋하지 않음

## 연동 상태

- GitHub 계정: `ydhappy`
- 저장소: `ydhappy/juq`
- 읽기·쓰기·관리자 권한 확인 완료
- ChatGPT GitHub 커넥터 연결 확인 완료

## Juq 360 앱

Juq는 투명한 0~360도 각도기 오버레이, 짧은 터치 방향 측정, 드래그 이동, 핀치 확대·축소, 긴 터치 메모·도형 메뉴와 캡처 저장 기능을 제공하는 Expo 기반 모바일 앱입니다.

| 항목 | 실행 방법 |
| --- | --- |
| 개발 서버 | `pnpm dev` |
| 단위 테스트 | `pnpm test` |
| 타입 검사 | `pnpm check` |
| 정적 검사 | `pnpm lint` |
| APK 빌드 | `pnpm apk:build` |

## Android APK 빌드

`main` 브랜치에 푸시하거나 Actions 탭에서 **Build Android APK** 워크플로를 수동 실행하면 EAS의 `preview` 프로필로 APK 빌드를 요청합니다. GitHub Actions에서 빌드를 실행하려면 저장소 **Settings → Secrets and variables → Actions**에 Expo 계정에서 생성한 `EXPO_TOKEN`을 추가해야 합니다. 빌드가 완료되면 EAS 빌드 페이지에서 APK를 내려받을 수 있습니다.
