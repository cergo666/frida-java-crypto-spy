Java.perform(() => {
    const IGNORE_KEYWORDS = [
        "ads", "admob", "appmetrica", "firebase",
        "google.analytics", "unity", "ironsource", "adcolony"
    ];
    const PRINT_STACKTRACE = true;

    const Cipher = Java.use("javax.crypto.Cipher");
    const SecretKeySpec = Java.use("javax.crypto.spec.SecretKeySpec");
    const IvParameterSpec = Java.use("javax.crypto.spec.IvParameterSpec");
    const GCMParameterSpec = Java.use("javax.crypto.spec.GCMParameterSpec");
    const Base64 = Java.use("android.util.Base64");
    const Arrays = Java.use("java.util.Arrays");
    const StringCls = Java.use("java.lang.String");
    const ExceptionCls = Java.use("java.lang.Exception");

    const green = "\x1b[32m", blue = "\x1b[34m", yellow = "\x1b[33m", reset = "\x1b[0m", cyan = "\x1b[36m", magenta = "\x1b[35m";
    const ctx = new Map();

    function encodeBytes(bytes) {
        if (!bytes) return null;
        try {
            const jsStr = StringCls.$new(bytes, "UTF-8") + "";
            return /^[\x20-\x7E\r\n\t]*$/.test(jsStr) && jsStr.length > 0
            ? jsStr
            : Base64.encodeToString(bytes, 0).toString();
        } catch (_) {
            return Base64.encodeToString(bytes, 0).toString();
        }
    }

    function logObj(title, obj) {
        console.log(`${yellow}[${title}]${reset}`);
        for (const [key, val] of Object.entries(obj)) {
            if (val !== null && val !== undefined) {
                console.log(`  ${blue}${key}${reset}: ${green}${val}${reset}`);
            }
        }
    }

    function printBacktrace(stack) {
        console.log(`${cyan}📚 Backtrace (depth: ${stack.length}) ↓↓↓${reset}`);
        stack.slice().reverse().forEach((frame, index) => {
            const indent = '  '.repeat(Math.min(index, 5));
            console.log(`${indent}${magenta}${index + 1}.${reset} ${yellow}${frame.getClassName()}.${green}${frame.getMethodName()}${cyan}(${frame.getFileName()}:${frame.getLineNumber()})${reset}`);
        });
        console.log(`${cyan}📚 [End of Backtrace]${reset}\n`);
    }

    function analyzeStack() {
        const stack = ExceptionCls.$new().getStackTrace();
        let initCount = 0;
        let ignored = false;

        for (let i = 0; i < stack.length; i++) {
            const cls = stack[i].getClassName();
            const mtd = stack[i].getMethodName();
            const fullStr = (cls + "." + mtd).toLowerCase();

            if (!ignored) {
                for (const kw of IGNORE_KEYWORDS) {
                    if (fullStr.includes(kw)) {
                        ignored = true;
                        break;
                    }
                }
            }

            if (cls === "javax.crypto.Cipher" && mtd === "init") {
                initCount++;
            }
        }

        return { ignored, isNested: initCount > 1, stack };
    }

    function extractInputBytes(args) {
        if (!args[0]) return null;

        if (args.length >= 3 && typeof args[1] === "number" && typeof args[2] === "number") {
            const offset = args[1];
            const length = args[2];
            return encodeBytes(Arrays.copyOfRange(args[0], offset, offset + length));
        }
        else if (args.length >= 2 && typeof args[1] === "number") {
            const offset = args[1];
            const length = args[0].length - offset;
            return encodeBytes(Arrays.copyOfRange(args[0], offset, offset + length));
        }
        else {
            return encodeBytes(args[0]);
        }
    }

    function extractOutputBytes(args, result) {
        if (result !== null && result !== undefined && typeof result !== "number") {
            return encodeBytes(result);
        }
        if (typeof result === "number" && args.length >= 4 && args[3]) {
            return encodeBytes(Arrays.copyOfRange(args[3], 0, result));
        }
        return null;
    }

    Cipher.getInstance.overloads.forEach(o => {
        o.implementation = function () {
            const analysis = analyzeStack();
            if (analysis.ignored) {
                return o.apply(this, arguments);
            }

            const result = o.apply(this, arguments);
            const transformation = arguments[0];

            logObj("Cipher.getInstance", { transformation });
            if (PRINT_STACKTRACE) printBacktrace(analysis.stack);
            return result;
        };
    });

    Cipher.init.overloads.forEach(o => {
        o.implementation = function () {
            const analysis = analyzeStack();
            if (analysis.ignored || analysis.isNested) {
                return o.apply(this, arguments);
            }

            const op = arguments[0].valueOf();
            const mode = op === Cipher.ENCRYPT_MODE.value ? "ENCRYPT"
            : op === Cipher.DECRYPT_MODE.value ? "DECRYPT" : op;

            let keyStr = "unknown";
            try {
                keyStr = encodeBytes(Java.cast(arguments[1], SecretKeySpec).getEncoded());
            } catch (_) {
                try { keyStr = arguments[1].getAlgorithm() + " (non-SecretKeySpec)"; } catch(e) {}
            }

            let iv = null, tagLength = null;
            for (let i = 2; i < arguments.length; i++) {
                const p = arguments[i];
                if (!p) continue;
                if (GCMParameterSpec.class.isInstance(p)) {
                    const g = Java.cast(p, GCMParameterSpec);
                    iv = encodeBytes(g.getIV());
                    tagLength = g.getTLen();
                } else if (IvParameterSpec.class.isInstance(p)) {
                    iv = encodeBytes(Java.cast(p, IvParameterSpec).getIV());
                }
            }

            let transformation = "unknown";
            try { transformation = this.getAlgorithm(); } catch(e) {}

            const handle = this.hashCode().toString();
            ctx.set(handle, { transformation, mode });

            logObj("Cipher.init", {
                transformation,
                mode,
                key: keyStr,
                iv,
                tagLength
            });

            if (PRINT_STACKTRACE) printBacktrace(analysis.stack);
            return o.apply(this, arguments);
        };
    });

    Cipher.update.overloads.forEach(o => {
        o.implementation = function () {
            const analysis = analyzeStack();
            if (analysis.ignored) {
                return o.apply(this, arguments);
            }

            const out = o.apply(this, arguments);

            const handle = this.hashCode().toString();
            const c = ctx.get(handle);

            if (!c || c.mode === undefined) return out;

            const inputData = extractInputBytes(arguments);
            const outputData = out ? encodeBytes(out) : null;

            logObj("Cipher.update", {
                transformation: c.transformation,
                mode: c.mode,
                input: inputData,
                output: outputData
            });
            if (PRINT_STACKTRACE) printBacktrace(analysis.stack);
            return out;
        };
    });

    Cipher.doFinal.overloads.forEach(o => {
        o.implementation = function () {
            const analysis = analyzeStack();
            if (analysis.ignored) {
                return o.apply(this, arguments);
            }

            const result = o.apply(this, arguments);

            const handle = this.hashCode().toString();
            const c = ctx.get(handle);

            if (!c || c.mode === undefined) return result;

            const inputData = extractInputBytes(arguments);
            const outputData = extractOutputBytes(arguments, result);

            logObj("Cipher.doFinal", {
                transformation: c.transformation,
                mode: c.mode,
                input: inputData,
                output: outputData
            });
            if (PRINT_STACKTRACE) printBacktrace(analysis.stack);
            return result;
        };
    });

    if (Cipher.updateAAD) {
        Cipher.updateAAD.overloads.forEach(o => {
            o.implementation = function () {
                const analysis = analyzeStack();
                if (analysis.ignored) {
                    return o.apply(this, arguments);
                }

                const handle = this.hashCode().toString();
                const c = ctx.get(handle);
                if (!c || c.mode === undefined) return o.apply(this, arguments);

                logObj("Cipher.updateAAD", {
                    transformation: c.transformation,
                    mode: c.mode,
                    aad: encodeBytes(arguments[0])
                });
                if (PRINT_STACKTRACE) printBacktrace(analysis.stack);
                return o.apply(this, arguments);
            };
        });
    }

    console.log(`${green}[+] Crypto Hooks installed. Ignore list: ${IGNORE_KEYWORDS.join(", ")}${reset}`);
});
