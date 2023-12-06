/**
 * Optimize the AVG by collapse unnecessarily nested groups
 * 
 * Basic ideas:
 * 1. combine transform props from parent group to children if meet these conditions
 *      a. with one only one child. Because with more than one child, we're very likely to increase the total lines of code
 *      b. no pivot confilcts between parent & child. Pivots are used for rotation and scales
 *      c. no complex props to combine. e.g. if parent with complex prop "opacity": "${frame >= 100 && frame <= 200 ? 1 : 0}",
 *         and child also has "opacity" prop
 * 2. collapse the parent-child group relationship if all props from parent are combined, and it has 1 or 0 child
*/

import { TYPE, ITEMS, GROUP, TRANSLATE, TRANSLATE_X, TRANSLATE_Y, PIVOT, PIVOT_X, PIVOT_Y, ROTATION, SCALE, SCALE_X, SCALE_Y, OPACITY, CLIPPATH } from './constants'

const NUMERIC = '_numeric';             // e.g. 12 or "12"
const DATA_BINDING = '_data_binding';   // e.g. "${@ease(frame)}"
const SPECIAL = '_special';             // e.g."${frame >= 100 && frame <= 200 ? 1 : 0}", true, or anything else
const REGEX_SIMPLE_DATA_BINDING = /^\${([a-zA-Z0-9_+\-*\/@(). ]*)}$/;   // e.g. "${200 + @ease(frame)-1 * (-90.2/2)}"
const REGEX_WITH_ADDITION_OR_SUBTRACTION = /^.*[+-].*$/;                // e.g. "@ease(frame) + 1"
const REGEX_WHITESPACE = /\s+/gm;
const TRANSLATES = [TRANSLATE_X, TRANSLATE_Y];
const PIVOTS = [PIVOT_X, PIVOT_Y];
const GROUP_PROPS = [TRANSLATE_X, TRANSLATE_Y, PIVOT_X, PIVOT_Y, ROTATION, SCALE_X, SCALE_Y, OPACITY, CLIPPATH];

export enum Arithmetic {
    ADDITION = '+',
    SUBTRACTION = '-',
    MULTIPLICATION = '*',
    DIVISION = '/'
}

export const collapseGroups = (input: any, shouldTryPropsCombining: boolean = true) => {
    // make a deep copy
    let rootItem = JSON.parse(JSON.stringify(input));

    wrapItemsInList(rootItem[ITEMS], rootItem);
    if (shouldTryPropsCombining) {
        disassembleNumericAndDataBindingProps(rootItem[ITEMS]);
        combineProps(rootItem[ITEMS], {});
        assembleNumericAndDataBindingProps(rootItem[ITEMS]);
    }
    flattenGroups(rootItem[ITEMS], rootItem);

    return rootItem;
}

// change all "items": {} to "items": []
export const wrapItemsInList = (items: any, parentItem: any): void => {
    if (Array.isArray(items)) {
        items.forEach(item => {
            if (item[TYPE] == GROUP && item.hasOwnProperty(ITEMS)) {
                wrapItemsInList(item[ITEMS], item);
            }
        })
    } else {
        parentItem[ITEMS] = [items];
    }
}

// rename props by value types, so it'll be easier to calculate
export const disassembleNumericAndDataBindingProps = (itemList: any[]): void => {
    itemList.forEach(item => {
        if (item[TYPE] == GROUP) {
            removeUnnecessaryProps(item);

            GROUP_PROPS.forEach(prop => {
                if (item.hasOwnProperty(prop)) {
                    let propValue = item[prop];
                    if (isNum(propValue)) {
                        item[prop + NUMERIC] = Number(propValue);
                    } else if (isSimpleDataBinding(propValue)) {
                        item[prop + DATA_BINDING] = propValue.replace(REGEX_WHITESPACE,'');
                    } else {
                        item[prop + SPECIAL] = propValue;
                    }
                    delete item[prop];
                }
            })

            if (item.hasOwnProperty(ITEMS)) {
                disassembleNumericAndDataBindingProps(item[ITEMS]);
            }
        }
    })
}

export const combineProps = (itemList: any[], propsToCombine: any): boolean => {
    const shouldCombineProps = checkShouldCombineProps(itemList, propsToCombine);

    itemList.forEach(item => {
        if (item[TYPE] == GROUP) {
            // combine props
            if (shouldCombineProps) {
                const hasPivotRelatedPropsToCombine = Object.keys(propsToCombine).some(toCombine => {
                    return isPivotRelatedProp(toCombine);
                });
                // offsetting pivots value:
                // when moving pivot-related props from parent to child, need to minus the child_translates from parent_pivots
                if (hasPivotRelatedPropsToCombine) {
                    for (let i=0; i<2; i++) {
                        let pivotNumeric = PIVOTS[i] + NUMERIC;
                        let pivotDataBinding = PIVOTS[i] + DATA_BINDING;
                        let translateNumeric = TRANSLATES[i] + NUMERIC;
                        let translateDataBinding = TRANSLATES[i] + DATA_BINDING;
                        if(item.hasOwnProperty(translateNumeric)) {
                            combineByNumericCalculation(propsToCombine, pivotNumeric, item[translateNumeric], Arithmetic.SUBTRACTION);
                        }
                        if(item.hasOwnProperty(translateDataBinding)) {
                            combineByStringConcat(propsToCombine, pivotDataBinding, item[translateDataBinding], Arithmetic.SUBTRACTION);
                        }
                    }
                }

                // combine props by value types
                Object.entries(propsToCombine).forEach(pair => {
                    let toCombine = pair[0];
                    let toCombineValue = pair[1];
                    if (toCombine.includes(NUMERIC)) {
                        combineByNumericCalculation(item, toCombine, toCombineValue);
                    } else if (toCombine.includes(DATA_BINDING)) {
                        combineByStringConcat(item, toCombine, toCombineValue);
                    } else if (toCombine.includes(SPECIAL)) {
                        item[toCombine] = toCombineValue;
                    }
                })
                // some combined results may become 0 or 1
                removeUnnecessaryProps(item);
            }

            // recursively combine props to grandchild group
            if (item.hasOwnProperty(ITEMS)) {
                let childItemList = item[ITEMS];
                let childPropsToCombine = {};
                // collect props to combine from child
                GROUP_PROPS.forEach(prop => {
                    [NUMERIC, DATA_BINDING, SPECIAL].forEach(postfix => {
                        let propWithPostfix = prop + postfix;
                        if (item.hasOwnProperty(propWithPostfix)) {
                            childPropsToCombine[propWithPostfix] = item[propWithPostfix];
                        }
                    })
                })
                // try to combine the props to grandchild, and delete them from child if succeeded
                let childShouldCombineProps = combineProps(childItemList, childPropsToCombine);
                if (childShouldCombineProps) {
                    Object.keys(childPropsToCombine).forEach(propCombined => {
                        delete item[propCombined];
                    })
                }
            }
        }
    })
    return shouldCombineProps;
}

const isPivotRelatedProp = (prop: string): boolean => {
    return [PIVOT, ROTATION, SCALE].some(pivotKeyWord => {
        return prop.includes(pivotKeyWord)
    });
}

// assemble string and number values and recover the names of props
export const assembleNumericAndDataBindingProps = (itemList: any[]): void => {
    itemList.forEach(item => {
        if (item[TYPE] == GROUP) {
            GROUP_PROPS.forEach(prop => {
                let propNumeric = prop + NUMERIC;
                let propDataBinding = prop + DATA_BINDING;
                let propSpecial = prop + SPECIAL;
                if (item.hasOwnProperty(propDataBinding)) {
                    if (item.hasOwnProperty(propNumeric)) {
                        combineByStringConcat(item, propDataBinding, item[propNumeric]);
                    }
                    item[prop] = item[propDataBinding];
                } else if (item.hasOwnProperty(propNumeric)) {
                    item[prop] = item[propNumeric];
                } else if (item.hasOwnProperty(propSpecial)) {
                    item[prop] = item[propSpecial];
                }
                delete item[propNumeric];
                delete item[propDataBinding];
                delete item[propSpecial];
            })

            if (item.hasOwnProperty(ITEMS)) {
                assembleNumericAndDataBindingProps(item[ITEMS]);
            }
        }
    })
}

export const flattenGroups = (itemList: any[], parentItem: any): void => {
    let flattenedItemList = [];
    itemList.forEach(item => {
        if (item[TYPE] == GROUP && item.hasOwnProperty(ITEMS)) {
            flattenGroups(item[ITEMS], item);
            if (Object.keys(item).length === 2 && item[ITEMS].length <= 1) {
                // when child group only has "type" and "items", and there're 1 or 0 grandchild in "items"
                // directly link grandchild to parent
                flattenedItemList = flattenedItemList.concat(item[ITEMS]);
            } else {
                flattenedItemList.push(item);
            }
        } else {
            flattenedItemList.push(item);
        }
    })
    parentItem[ITEMS] = flattenedItemList;
}

export const isNum = (value: any): boolean => {
    return typeof value == 'number'
        || (typeof value == 'string' && !isNaN(Number(value)) && !isNaN(parseFloat(value)));
}

export const isSimpleDataBinding = (value: any): boolean => {
    return typeof value == 'string' && REGEX_SIMPLE_DATA_BINDING.test(value);
}

export const convertValueToCalculableString = (value: any, arithmetic: Arithmetic = null): string => {
    let result = '';
    if (isNum(value)) {
        result = String(value);
    } else if (isSimpleDataBinding(value)) {
        result = REGEX_SIMPLE_DATA_BINDING.exec(value)[1];
    }

    // wrap with () if needed
    if (result.startsWith(Arithmetic.SUBTRACTION)
        || (arithmetic == Arithmetic.MULTIPLICATION && REGEX_WITH_ADDITION_OR_SUBTRACTION.test(result))) {
            result = `(${result})`;
    }

    return result.replace(REGEX_WHITESPACE,'');
}

const removePropByValue = (propKeyword: string, item: any, valueToRemove: number): void => {
    Object.entries(item).forEach(pair => {
        let prop = pair[0];
        let propValue = pair[1];

        if (prop.includes(propKeyword) && isNum(propValue) && Number(propValue) === valueToRemove) {
            delete item[prop];
        }
    })
}

export const removeUnnecessaryProps = (item: any): void => {
    // remove props undefinded or starting with '_'
    Object.keys(item).forEach(prop => {
        if (item[prop] == undefined || prop.startsWith('_')) {
            delete item[prop];
        }
    })

    // remove props if they have default values
    removePropByValue(TRANSLATE, item, 0.0);
    removePropByValue(PIVOT, item, 0.0);
    removePropByValue(ROTATION, item, 0.0);
    removePropByValue(SCALE, item, 1.0);
    removePropByValue(OPACITY, item, 1.0);

    // remove pivotX and pivotY if there's no rotation or scale
    let shouldRemovePivots = true;
    Object.keys(item).forEach(prop => {
        if (prop.includes(ROTATION) || prop.includes(SCALE)) {
            shouldRemovePivots = false;
        }
    })
    if (shouldRemovePivots) {
        PIVOTS.forEach(pivot => {
            [NUMERIC, DATA_BINDING, SPECIAL].forEach(postfix => {
                delete item[pivot];
                delete item[pivot + postfix]
            })
        })
    }

}

export const checkShouldCombineProps = (itemList: any[], propsToCombine: any): boolean => {
    // won't combine when parent group has more than one child
    if (itemList.length > 1) {
        return false;
    }

    let numGroupItems = 0;
    for (const item of itemList) {
        if (item[TYPE] == GROUP) {
            numGroupItems += 1;

            for (const prop of Object.keys(item)) {
                const isPivotRelatedItemProp = isPivotRelatedProp(prop);
                for (const toCombine of Object.keys(propsToCombine)) {
                    // won't combine when parent and child both has pivot-related props
                    // or if parent has clipPath and child has translate
                    if ((isPivotRelatedProp(toCombine) && isPivotRelatedItemProp)
                        || (toCombine.includes(CLIPPATH) && prop.includes(TRANSLATE))) {
                        return false;
                    }
                }

                // won't combine special values which aren't trivial to calculate
                if (prop.includes(SPECIAL) && propsToCombine.hasOwnProperty(prop)) {
                    return false;
                }
            }
        }
    }

    // won't combine if there's no group-type child
    if (numGroupItems === 0) {
        return false;
    }

    return true;
}

const getArithmetic = (prop: string): Arithmetic => {
    // scale and opacity should be combined by multiplication, and others by addition
    let arithmetic = Arithmetic.ADDITION;
    [SCALE, OPACITY].forEach(propKeyWord => {
        if (prop.includes(propKeyWord)) {
            arithmetic = Arithmetic.MULTIPLICATION;
        }
    })
    return arithmetic;
}

export const combineByNumericCalculation = (item: any, prop: string, toCombine: any, arithmetic:Arithmetic = null): void => {
    let propValue = item[prop];
    if ((propValue != undefined && !isNum(propValue)) || !isNum(toCombine)) {
        return;
    }

    toCombine = Number(toCombine);
    if (arithmetic == null) {
        arithmetic = getArithmetic(prop);
    }
    switch (arithmetic) {
        case Arithmetic.ADDITION:
            let original = propValue != undefined ? Number(propValue) : 0;
            item[prop] = original + toCombine;
            break;
        case Arithmetic.SUBTRACTION:
            original = propValue != undefined ? Number(propValue) : 0;
            item[prop] = original - toCombine;
            break;
        case Arithmetic.MULTIPLICATION:
            original = propValue != undefined ? Number(propValue) : 1;
            item[prop] = original * toCombine;
            break;
    }
}

export const combineByStringConcat = (item: any, prop: string, toCombine: any, arithmetic:Arithmetic = null): void => {
    let propValue = item[prop];
    if (arithmetic == null) {
        arithmetic = getArithmetic(prop);
    }
    let origninal = convertValueToCalculableString(propValue, arithmetic);
    toCombine = convertValueToCalculableString(toCombine, arithmetic);
    if ((propValue && !origninal) || !toCombine) {
        return;
    }

    if (propValue) {
        item[prop] = `\${${origninal}${arithmetic}${toCombine}}`;
    } else if (arithmetic == Arithmetic.SUBTRACTION) {
        item[prop] = `\${-${toCombine}}`;
    } else {
        item[prop] = `\${${toCombine}}`;
    }
}
