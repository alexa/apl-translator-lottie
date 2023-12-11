# Changelog
All notable changes to this project will be documented in this file.

## [1.1.0] - 2023-12-11
Various enhancements, fixes and samples:
- Support image conversion
- Define "frame" inside AVG instead of exposing as a paramter
- Add a step to flatten unnecessary nested groups
- Draw the rect from top right instead of top left
- Add warning for cases when alpha locations are not equal to color locations
- Fix matte transform bug
- Remove incorrect ellipse start/end conversion
- Fix ClipPath parsing bug
- Add support for alpha values in colors
- Add @babel/plugin-proposal-class-properties to fix build

## [1.0.1] - 2022-10-25
- Fix build scripts

## [1.0.0] - 2022-10-18
- First Release
- Support Lottie files created in Adobe After Effects with the Bodymovin plugin 5.7.5
- Support [AVG format](https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-avg-format.html) included in APL version 2022.1
