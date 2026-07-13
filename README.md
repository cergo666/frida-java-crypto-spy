# 🕵️‍♂️ frida-java-crypto-spy

`frida-java-crypto-spy` is a powerful [Frida](https://frida.re) script for Android reverse engineering that hooks into Java's `javax.crypto.Cipher` class and other crypto-related classes.

It supports a wide variety of cipher modes, including:
- AES/ECB
- AES/CBC
- AES/GCM
- and others...

Logs include transformation type, operation mode, key material, IV, AAD, tag length, and the actual input/output data (Base64 or UTF-8 if printable).

---

## ⚙️ Features

- 🔍 Hooks `Cipher.getInstance`, `init`, `update`, `doFinal`, `updateAAD`
- 🔑 Direct interception of `SecretKeySpec`, `IvParameterSpec`
- 📦 Logs plaintext/ciphertext input/output
- 🧊 Handles different cipher modes (`CBC`, `GCM`, etc.)
- 📚 Optional backtrace output (toggle via `PRINT_STACKTRACE`)
- 🔢 Call counting for each hooked method
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
    KeyGenParameterSpec: false,
    KeyStore: true,
    SSLContext: false,
    OkHttp: false,
    EncryptedSharedPrefs: false,
    SQLCipher: false,
    Tink: false
};
```

### Module Toggles

| Module | Default | Description |
|--------|---------|-------------|
| `Cipher` | ON | AES, DES, RSA and other cipher operations |
| `SecretKeySpec` | ON | Direct key material interception |
| `IvParameterSpec` | ON | IV parameter interception |
| `KeyStore` | ON | Android KeyStore operations |
| `KeyGenerator` | OFF | Symmetric key generation |
| `KeyPairGenerator` | OFF | Asymmetric key pair generation |
| `MessageDigest` | OFF | Hash functions (SHA-256, MD5, etc.) |
| `SecretKeyFactory` | OFF | Key derivation (PBKDF2, SCrypt) |
| `Signature` | OFF | Digital signature operations |
| `Mac` | OFF | HMAC operations |
| `KeyGenParameterSpec` | OFF | Android Keystore key generation params |
| `SSLContext` | OFF | SSL/TLS context operations |
| `OkHttp` | OFF | OkHttp certificate pinning |
| `EncryptedSharedPrefs` | OFF | EncryptedSharedPreferences |
| `SQLCipher` | OFF | SQLCipher encrypted databases |
| `Tink` | OFF | Google Tink crypto library |

---

## 🚀 Example Usage

```bash
frida -U -f target.app.package -l frida-java-crypto-spy.js
```

---

## 📄 Sample Output

### 🧊 AES/CBC/PKCS5Padding

```bash
[Cipher.init] #1
  transformation: AES/CBC/PKCS5Padding
  mode: ENCRYPT
  key: oOej3ieYR1DYWnubZmjIXg==
  keyHEX: a0e7ebde878758d750d6d6ae66668586
  iv: odaCWSCFyF7C+9xclJdIDw==

[Cipher.doFinal] #1
  input: This is Secret
  output: uU0F7JMrbFUGoYoXBCOLiQ==

[Cipher.init] #2
  transformation: AES/CBC/PKCS5Padding
  mode: DECRYPT
  key: oOej3ieYR1DYWnubZmjIXg==
  keyHEX: a0e7ebde878758d750d6d6ae66668586
  iv: odaCWSCFyF7C+9xclJdIDw==

[Cipher.doFinal] #2
  input: uU0F7JMrbFUGoYoXBCOLiQ==
  output: This is Secret
```

---

### 🔐 AES/GCM/NoPadding (with backtrace)

```bash
[Cipher.init] #1
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

[Cipher.doFinal] #1
  input: This is Secret
  output: 9Ga6l966s++p4i9OACbn3nRp95I9uZSUnJGRzU0H
📚 Backtrace (depth: 19) ↓↓↓
...
📚 [End of Backtrace]
```

---

### 🔑 KeyStore + SSL (security analysis)

```bash
[KeyStore.getInstance] #1
  type: BKS

[KeyStore.load] #1
  password: mypassword

[KeyStore.getEntry] #1
  alias: mykey
  resultType: java.security.KeyStore$PrivateCertEntry

[SSLContext.getInstance] #1
  protocol: TLS

[CertificatePinner.check] #1
  hostname: api.example.com
  peerCertificates: 1
📚 Backtrace (depth: 12) ↓↓↓
...
📚 [End of Backtrace]
```

---

## 📌 Notes

- `key` is only available if the algorithm uses `SecretKeySpec`
- `iv` is shown when using modes like CBC, GCM, etc.
- `tagLength` only applies to GCM or AEAD modes
- Inputs and outputs are shown in UTF-8 if printable, otherwise Base64
- Set `PRINT_STACKTRACE = false` for cleaner output
- Enable additional modules for deeper analysis
- HEX values are automatically shown for 16/20/24/32 byte keys
- Call count (`#N`) shows how many times each method was called

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
