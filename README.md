# Overview

This tool is used to convert [Lottie](https://github.com/airbnb/lottie-web)  animation to APL (Alexa Presentation Language) document. It supports Lottie files that were created in [Adobe After Effects](https://www.adobe.com/products/aftereffects.html) with the [Bodymovin plugin](https://aescripts.com/bodymovin/).

Currently, the converter won't be able to support all After Effects features. Make sure your animation doesn't use unsupported features. For details, see [supported features](https://developer.amazon.com/de-DE/docs/alexa/alexa-presentation-language/import-lottie-animation.html#supported-features).

## Release Notes

Changes are tracked in [CHANGELOG.md](CHANGELOG.md).

## Installation

The fastest way to use apl-translator-lottie is to install it from npm.

```
npm install apl-translator-lottie --save
```

## Usage

* To convert with a filepath

```
import {convertFile} from "apl-translator-lottie"

const aplDocument = convertFile('lottie_sample.json')
```

* To convert with a JSON object

```
import {convert} from "apl-translator-lottie"

let lottieJSON = {
        "v":"5.7.5"
    }
const aplDocument = convert(lottieJSON)
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the [Apache-2.0 license](https://www.apache.org/licenses/LICENSE-2.0), except Lottie samples and APL Templates are licensed under the [Amazon Software License](https://aws.amazon.com/asl/). For more detail, please see the LICENSE file under `/samples` folder.
