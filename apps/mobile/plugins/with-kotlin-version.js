const { withDangerousMod, withGradleProperties } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const KOTLIN_VERSION = "2.3.21";

function withKotlinClasspath(config) {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const buildGradlePath = path.join(
        config.modRequest.platformProjectRoot,
        "build.gradle"
      );

      if (!fs.existsSync(buildGradlePath)) {
        console.log("build.gradle not found, skipping Kotlin classpath patch");
        return config;
      }

      let content = fs.readFileSync(buildGradlePath, "utf-8");

      const kotlinClasspathRegex =
        /classpath\s*\(\s*['"]org\.jetbrains\.kotlin:kotlin-gradle-plugin['"]\s*\)/;
      const replacement = `classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:${KOTLIN_VERSION}")`;

      if (kotlinClasspathRegex.test(content)) {
        content = content.replace(kotlinClasspathRegex, replacement);
        fs.writeFileSync(buildGradlePath, content, "utf-8");
        console.log(`Patched Kotlin Gradle plugin to ${KOTLIN_VERSION}`);
      } else {
        console.log("Kotlin classpath pattern not found, skipping patch");
      }

      return config;
    },
  ]);
}

function withKotlinVersion(config) {
  config = withKotlinClasspath(config);

  config = withGradleProperties(config, (config) => {
    config.modResults.items.push({
      type: "property",
      key: "android.kotlinVersion",
      value: KOTLIN_VERSION,
    });
    return config;
  });

  return config;
}

module.exports = withKotlinVersion;
