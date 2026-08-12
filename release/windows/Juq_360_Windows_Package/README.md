# Juq 360 Windows 배포 패키지

이 폴더는 Juq 360 소스와 Windows 로컬 검증 도구를 포함한 배포 패키지입니다. 압축을 푼 뒤 `INSTALL_TO_C_TEST.bat`를 실행하면 소스가 `C:\test\Juq_360`으로 복사됩니다.

> **중요:** 이 패키지의 Windows 배치·PowerShell 파일은 Expo 또는 EAS를 실행하지 않습니다. Node.js와 pnpm으로 의존성과 TypeScript 상태를 검증하는 용도입니다. APK를 직접 로컬에서 만들려면 별도 Android 네이티브 프로젝트와 Gradle 빌드 환경이 필요합니다.[1]

## 포함 항목

| 항목 | 용도 |
|---|---|
| `source/` | 최신 Juq 360 전체 소스와 Expo·EAS 구성 |
| `INSTALL_TO_C_TEST.bat` | 소스를 `C:\test\Juq_360`에 설치 |
| `BUILD_APK.bat` | Windows 명령 프롬프트에서 로컬 의존성·타입 검증 |
| `BUILD_APK.ps1` | PowerShell에서 로컬 의존성·타입 검증 |
| `EXPO_TOKEN_TEMPLATE.txt` | 기존 원격 APK 빌드 구성에 대한 참고 안내 |

## 빠른 시작

먼저 Node.js 22 LTS와 pnpm을 설치합니다. 이후 이 폴더에서 `INSTALL_TO_C_TEST.bat`를 실행합니다. 설치가 끝나면 `C:\test\Juq_360`에서 `BUILD_APK.bat`를 실행하거나, PowerShell에서 `./BUILD_APK.ps1`를 실행합니다. 두 스크립트는 의존성을 설치하고 TypeScript 검증을 수행하며, 계정 로그인이나 원격 APK 빌드를 요청하지 않습니다.

## Android APK에 대한 참고

현재 Juq 소스는 Expo 기반이므로, 이 Windows 패키지에서 Expo·EAS를 제거하면 APK 원격 빌드는 시작되지 않습니다. Expo 없이 APK를 직접 만들려면 Android 네이티브 프로젝트로 내보낸 뒤 Gradle과 Android SDK를 별도로 구성해야 합니다.[1]

## 시스템 오버레이 권한

Juq는 Android APK에서 다른 앱 위 표시 권한을 선언합니다. 이 권한은 운영체제 특별 권한이므로 앱이 자동 승인할 수 없으며, 사용자가 Android 설정 화면에서 직접 허용해야 합니다.[2]

## References

[1] [Expo local app development and prebuild](https://docs.expo.dev/workflow/prebuild/)

[2] [Android SYSTEM_ALERT_WINDOW permission](https://developer.android.com/reference/android/Manifest.permission#SYSTEM_ALERT_WINDOW)
