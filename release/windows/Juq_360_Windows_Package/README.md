# Juq 360 Windows 배포 패키지

이 폴더는 Juq 360 소스와 Android APK 빌드를 Windows에서 실행하기 위한 배포 패키지입니다. 압축을 푼 뒤 `INSTALL_TO_C_TEST.bat`를 실행하면 소스가 `C:\test\Juq_360`으로 복사됩니다.

> **중요:** APK는 이 패키지에서 직접 컴파일하는 방식이 아니라 Expo EAS 원격 빌드를 요청해 생성합니다. 따라서 Windows에 Android Studio를 설치할 필요는 없지만, Expo 계정 인증 또는 `EXPO_TOKEN` 환경 변수가 필요합니다.[1]

## 포함 항목

| 항목 | 용도 |
|---|---|
| `source/` | 최신 Juq 360 전체 소스와 Expo·EAS 구성 |
| `INSTALL_TO_C_TEST.bat` | 소스를 `C:\test\Juq_360`에 설치 |
| `BUILD_APK.bat` | Windows 명령 프롬프트에서 EAS APK 빌드 요청 |
| `BUILD_APK.ps1` | PowerShell에서 EAS APK 빌드 요청 |
| `EXPO_TOKEN_TEMPLATE.txt` | EAS 토큰 환경 변수 등록 예시 |

## 빠른 시작

먼저 Node.js 22 LTS와 pnpm을 설치합니다. 이후 이 폴더에서 `INSTALL_TO_C_TEST.bat`를 실행합니다. 설치가 끝나면 `C:\test\Juq_360`에서 `BUILD_APK.bat`를 실행하거나, PowerShell에서 `./BUILD_APK.ps1`를 실행합니다.

처음 실행할 때는 Expo 계정으로 로그인해야 할 수 있습니다. 자동화용으로는 Expo 대시보드에서 발급한 토큰을 Windows 환경 변수 `EXPO_TOKEN`에 등록한 뒤 실행합니다. 빌드가 완료되면 EAS가 표시하는 페이지에서 APK 파일을 내려받습니다.[1]

## GitHub Actions 사용

소스는 [ydhappy/juq](https://github.com/ydhappy/juq)에 업로드돼 있습니다. 저장소의 **Settings → Secrets and variables → Actions**에 `EXPO_TOKEN`을 등록한 다음, **Actions → Build Android APK → Run workflow**를 실행해도 같은 APK 빌드를 요청할 수 있습니다.

## 시스템 오버레이 권한

Juq는 Android APK에서 다른 앱 위 표시 권한을 선언합니다. 이 권한은 운영체제 특별 권한이므로 앱이 자동 승인할 수 없으며, 사용자가 Android 설정 화면에서 직접 허용해야 합니다.[2]

## References

[1] [Expo EAS Build](https://docs.expo.dev/build/introduction/)

[2] [Android SYSTEM_ALERT_WINDOW permission](https://developer.android.com/reference/android/Manifest.permission#SYSTEM_ALERT_WINDOW)
