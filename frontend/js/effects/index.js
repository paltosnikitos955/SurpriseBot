import * as hearts from "./hearts.js"; import * as confetti from "./confetti.js"; import * as stars from "./stars.js"; import * as sparkles from "./sparkles.js"; import * as rain from "./rain.js"; import * as glitch from "./glitch.js"; import * as smoke from "./smoke.js";
export const effects={hearts,confetti,stars,sparkles,rain,glitch,smoke};
export function playEffect(layer,name,options={}){(effects[name]||sparkles).run(layer,options)}
