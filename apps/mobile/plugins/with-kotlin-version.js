const { withDangerousMod } = require("expo/config-plugins");
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

function withKotlinVersionProperty(config) {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const propsPath = path.join(
        config.modRequest.platformProjectRoot,
        "gradle.properties"
      );

      if (!fs.existsSync(propsPath)) {
        console.log("gradle.properties not found, skipping kotlinVersion property");
        return config;
      }

      let content = fs.readFileSync(propsPath, "utf-8");

      const kotlinPropRegex = /android\.kotlinVersion\s*=.*/;
      const replacement = `android.kotlinVersion=${KOTLIN_VERSION}`;

      if (kotlinPropRegex.test(content)) {
        content = content.replace(kotlinPropRegex, replacement);
      } else {
        content = content.trimEnd() + `\n${replacement}\n`;
      }

      fs.writeFileSync(propsPath, content, "utf-8");
      console.log(`Set android.kotlinVersion=${KOTLIN_VERSION} in gradle.properties`);

      return config;
    },
  ]);
}

function withKotlinVersion(config) {
  config = withKotlinClasspath(config);
  config = withKotlinVersionProperty(config);
  return config;
}

module.exports = withKotlinVersion;
