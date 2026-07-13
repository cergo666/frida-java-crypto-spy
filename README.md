# 🕵️‍♂️ frida-java-crypto-spy

`frida-java-crypto-spy` is a powerful [Frida](https://frida.re) script that hooks into Java's `javax.crypto.Cipher` class on Android apps and logs detailed encryption/decryption operations.

It supports a wide variety of cipher modes, including:
- AES/ECB
- AES/CBC
- AES/GCM
- and others...

Logs include transformation type, operation mode, key material, IV, AAD, tag length, and the actual input/output data (Base64 or UTF-8 if printable).

---

## ⚙️ Features

- 🔍 Logs `Cipher.getInstance`, `Cipher.init`, `update`, `doFinal`, and `updateAAD`
- 🔑 Extracts and displays keys (if `SecretKeySpec`)
- 📦 Logs plaintext/ciphertext input/output
- 🧊 Handles different cipher modes (`CBC`, `GCM`, etc.)
- 📚 Optional backtrace output (toggle via `PRINT_STACKTRACE`)
- 🎯 Designed for reverse engineering and dynamic analysis
- 🧩 Modular architecture with per-module toggles

---

## ⚙️ Configuration

Edit the top of `frida-java-crypto-spy.js` to customize:

```javascript
const MODULES = {
    Cipher: true,
    SecretKeySpec: true,
    IvParameterSpec: true,
    KeyGenerator: false,
    KeyPairGenerator: false,
    MessageDigest: false,
    SecretKeyFactory: false,
    Signature: false,
    Mac: false,
    KeyGenParameterSpec: false
};

const IGNORE_KEYWORDS = [
    "ads", "admob", "appmetrica", "firebase",
    "google.analytics", "unity", "ironsource", "adcolony",
    "io.appmetrica.analytics",
    "com.facebook.ads",
    "com.facebook.ads.internal",
    "com.google.android.gms.ads",
    "com.google.android.gms.analytics",
    "com.google.firebase.analytics",
    "com.google.firebase.messaging",
    "com.yandex.mobile.ads",
    "com.yandex.appmetrica",
    "com.ironsource",
    "com.applovin",
    "com.unity3d.ads",
    "com.unity3d.services",
    "com.chartboost",
    "com.vungle",
    "com.mbridge",
    "com.inmobi",
    "com.startapp",
    "com.tapjoy",
    "com.adcolony",
    "com.pangle",
    "com.bytedance.sdk.openadsdk",
    "com.kidoz",
    "com.fyber",
    "com.smaato",
    "com.braze",
    "com.appsflyer",
    "com.adjust.sdk",
    "com.kochava",
    "com.branch",
    "com.amplitude",
    "com.mixpanel",
    "com.segment",
    "com.tealium",
    "com.batch",
    "com.onesignal",
    "com.pushwoosh",
    "com.urbanairship",
    "io.branch.referral",
    "net.hockeyapp",
    "com.microsoft.appcenter"
];
const PRINT_STACKTRACE = true;
```

| Variable | Description |
|----------|-------------|
| `MODULES.*` | Toggle individual crypto modules on/off |
| `IGNORE_KEYWORDS` | List of keywords to filter out ad/analytics SDK calls |
| `PRINT_STACKTRACE` | Toggle backtrace output on/off |

### Module Toggles

| Module | Default | Description |
|--------|---------|-------------|
| `Cipher` | ON | AES, DES, RSA and other cipher operations |
| `SecretKeySpec` | ON | Direct key material interception |
| `IvParameterSpec` | ON | IV parameter interception |
| `KeyGenerator` | OFF | Symmetric key generation |
| `KeyPairGenerator` | OFF | Asymmetric key pair generation |
| `MessageDigest` | OFF | Hash functions (SHA-256, MD5, etc.) |
| `SecretKeyFactory` | OFF | Key derivation (PBKDF2, SCrypt) |
| `Signature` | OFF | Digital signature operations |
| `Mac` | OFF | HMAC operations |
| `KeyGenParameterSpec` | OFF | Android Keystore key generation params |

---

## 🚀 Example Usage

```bash
frida -U -f target.app.package -l frida-java-crypto-spy.js
```

---

## 📄 Sample Output

### 🧊 AES/CBC/PKCS5Padding

```bash
[Cipher.init]
  transformation: AES/CBC/PKCS5Padding
  mode: ENCRYPT
  key: oOej3ieYR1DYWnubZmjIXg==
  keyHEX: a0e7ebde878758d750d6d6ae66668586
  iv: odaCWSCFyF7C+9xclJdIDw==

[Cipher.doFinal]
  input: This is Secret
  output: uU0F7JMrbFUGoYoXBCOLiQ==

[Cipher.init]
  transformation: AES/CBC/PKCS5Padding
  mode: DECRYPT
  key: oOej3ieYR1DYWnubZmjIXg==
  keyHEX: a0e7ebde878758d750d6d6ae66668586
  iv: odaCWSCFyF7C+9xclJdIDw==

[Cipher.doFinal]
  input: uU0F7JMrbFUGoYoXBCOLiQ==
  output: This is Secret
```

---

### 🔐 AES/GCM/NoPadding (with backtrace)

```bash
[Cipher.init]
  transformation: AES/GCM/NoPadding
  mode: ENCRYPT
  key: oHeY9IH3/QHKXVu3BCTbWQ==
  iv: +koINuprs1G9C4ir
  tagLength: 128
📚 Backtrace (depth: 19) ↓↓↓
1. com.android.internal.os.ZygoteInit.main(ZygoteInit.java:861)
  2. com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:533)
    3. java.lang.reflect.Method.invoke(Method.java:-2)
      ...
        16. com.mkv.aes.MainActivity.onCreate(MainActivity.kt:20)
          17. com.mkv.aes.Test.runAllTests(Test.java:81)
            18. com.mkv.aes.AES.encryptGCMWithHMAC(AES.java:325)
              19. javax.crypto.Cipher.init(Cipher.java:-2)
📚 [End of Backtrace]

[Cipher.doFinal]
  input: This is Secret
  output: 9Ga6l966s++p4i9OACbn3nRp95I9uZSUnJGRzU0H
📚 Backtrace (depth: 19) ↓↓↓
...
📚 [End of Backtrace]
```

---

### 🔑 SecretKeySpec + HMAC (with all modules enabled)

```bash
[SecretKeySpec.$init]
  key: oOej3ieYR1DYWnubZmjIXg==
  algorithm: AES

[Mac.init]
  algorithm: HmacSHA256
  key: oOej3ieYR1DYWnubZmjIXg==

[Mac.doFinal]
  algorithm: HmacSHA256
  input: This is Secret
  output: uU0F7JMrbFUGoYoXBCOLiQ==

[MessageDigest.digest]
  algorithm: SHA-256
  output: ...
```

---

## 📌 Notes

- `key` is only available if the algorithm uses `SecretKeySpec`
- `iv` is shown when using modes like CBC, GCM, etc.
- `tagLength` only applies to GCM or AEAD modes
- Inputs and outputs are shown in UTF-8 if printable, otherwise Base64
- Set `PRINT_STACKTRACE = false` for cleaner output
- Enable `MODULES.MessageDigest`, `MODULES.Mac`, etc. for additional crypto analysis
- HEX values are automatically shown for 16/20/24/32 byte keys

---

## 📜 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for more details.

---

## 🤝 Contribution

Feel free to open issues or submit pull requests if you have improvements or want to support more cipher modes.

---

## 🔥 Author

**Mehdi Karzari**
[Telegram (QM4RS)](https://t.me/QM4RS)
