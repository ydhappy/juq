# Android 시스템 오버레이 요구사항

Juq의 현재 잠금·해제 기능은 앱 내부 오버레이 동작을 제어한다. 다른 앱 위에 각도기를 실제로 띄우는 기능은 Android 전용 네이티브 구현이 추가로 필요하다.

Android 공식 문서에 따르면 다른 앱 위 창에는 `SYSTEM_ALERT_WINDOW` 특별 권한과 `WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY` 창 유형이 필요하다. 이 창 유형은 일반 앱 활동 창보다 위에 표시되지만 상태 표시줄이나 IME 같은 핵심 시스템 창보다는 아래에 놓인다. 잠금 상태에서 다른 앱의 터치를 통과시키려면 네이티브 창에 `FLAG_NOT_TOUCHABLE`을 적용하고, 해제 상태에서만 터치 가능 플래그를 복원하는 방식이 적합하다.

Expo Go 및 현재 관리형 JavaScript 앱만으로는 이 Android 시스템 창·백그라운드 서비스를 제공할 수 없다. 실제 기능을 배포하려면 Android 네이티브 모듈, 시스템 오버레이 권한 설정 화면 유도, 포그라운드 서비스, 그리고 커스텀 개발 빌드 또는 네이티브 APK 빌드가 필요하다.

권한 설정 화면 이동에는 `expo-intent-launcher`의 `startActivityAsync`와 Android `MANAGE_OVERLAY_PERMISSION` 액션을 사용할 수 있다. 이는 사용자가 특별 권한을 검토·승인하는 시스템 설정 화면을 여는 용도이며, 앱이 권한을 자동 승인하는 기능은 아니다.

## 공식 참고 자료

- [Android `SYSTEM_ALERT_WINDOW` 권한](https://developer.android.com/reference/android/Manifest.permission#SYSTEM_ALERT_WINDOW)
- [Android `TYPE_APPLICATION_OVERLAY` 창 유형](https://developer.android.com/reference/android/view/WindowManager.LayoutParams#TYPE_APPLICATION_OVERLAY)
- [Expo IntentLauncher](https://docs.expo.dev/versions/latest/sdk/intent-launcher/)
