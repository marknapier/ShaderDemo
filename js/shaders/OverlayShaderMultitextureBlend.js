/**
 * @author alteredq / http://alteredqualia.com/
 *
 * Dot screen shader
 * based on glfx.js sepia shader
 * https://github.com/evanw/glfx.js
 */

THREE.OverlayShaderMultitextureBlend = {

	uniforms: {
		"tDiffuse": { type: "t", value: null },
		"overlay1": { type: "t", value: null },
		"overlay2": { type: "t", value: null },
		"overlay3": { type: "t", value: null },
		"repeat":   { type: "v2", value: new THREE.Vector2(8.0, 4.0) }
	},

	vertexShader: [
		"varying vec2 vUv;",

		"void main() {",
			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	].join("\n"),

	fragmentShader: [
		"uniform float scale;",
		"uniform sampler2D tDiffuse;",
		"uniform sampler2D overlay1;",  // lightest
		"uniform sampler2D overlay2;",
		"uniform sampler2D overlay3;",	// darkest
		"uniform vec2 repeat;",
		"varying vec2 vUv;",

		"vec4 getColor(sampler2D overlay) {",
			"vec4 overlaycolor = texture2D(overlay, fract(repeat * vUv));",  // tile the overlay image
			"return ( overlaycolor );",
		"}",

		// return whiteness of the color: 1 if color is white, 0 if black
		"float how_close_to_white(vec4 some_color) {",
			"float dotproduct = dot(vec4(1.0, 1.0, 1.0, 0.0), some_color);",
			"return ( dotproduct / 3.0 );",
		"}",

		"vec4 colorConvertSepia(vec4 c) {",
			"vec4 sepia = vec4(0.0);",
			"vec3 c_in = c.rgb;",
			"sepia.r = dot(c_in, vec3(.40, .40, .40));",
			"sepia.g = dot(c_in, vec3(.30, .45, .15));",
			"sepia.b = dot(c_in, vec3(.30, .30, .10));",
			"sepia.a = c.a;",
			"return ( sepia );",
		"}",

		"void main() {",
			"vec4 colorIn = texture2D( tDiffuse, vUv );",  // should be grayscale
			"vec4 colorOvl = vec4(0.0);",
			"vec4 blank = vec4(0.0);",
			"float blendFactor = 0.0;",

			// "if (colorIn.g != 1.0) {",			// MJN skip background color (green)
			"if (colorIn.a != 0.0) {",			// MJN skip transparent background 
				"if (colorIn.r < .75) {",
				"	vec4 c = getColor(overlay1);",	// lite
				"	float whiteness = how_close_to_white(c);",  // will be 1 if pure white
				"	blendFactor = 1. - (colorIn.r / .75);",		// where is the gray in this range: 0 if gray is at the top of the band, 1 if at the bottom
				"	colorOvl = vec4(c.r, c.g, c.b, (1.0-whiteness) * blendFactor);",  // alpha is whiteness
				// "	colorOvl = mix(colorOvl, c, (1.0-whiteness) * blendFactor);",  // mix overlay image into colorOvl: whiter colors become transparent
				// "	colorOvl = colorConvertSepia(colorOvl);",
				"}",
				"if (colorIn.r < .50) {",
				"	vec4 c = getColor(overlay2);",	// medium
				"	float whiteness = how_close_to_white(c);",  // we'll convert white to transparent
				"	blendFactor = 1. - (colorIn.r / .50);",
				"	if (colorOvl != blank) {",
				"		colorOvl = mix(colorOvl, c, (1.0-whiteness) * blendFactor);",
				"	} else {",
				"		colorOvl = vec4(c.r, c.g, c.b, (1.0-whiteness) * blendFactor);",  // alpha is whiteness
				"	}",
				// "	colorOvl = colorConvertSepia(colorOvl);",
				"}",
				"if (colorIn.r < .25) {",
				"	vec4 c = getColor(overlay3);",	// dark
				"	float whiteness = how_close_to_white(c);",  // we'll convert white to transparent
				"	blendFactor = 1. - (colorIn.r / .25);",
				"	if (colorOvl != blank) {",
				"		colorOvl = mix(colorOvl, c, (1.0-whiteness) * blendFactor);",
				"	} else {",
				"		colorOvl = vec4(c.r, c.g, c.b, (1.0-whiteness) * blendFactor);",  // alpha is whiteness
				"	}",
				// "	colorOvl = colorConvertSepia(colorOvl);",
				"}",
			"}",
			"gl_FragColor = colorOvl;",
		"}"
	].join("\n")

};
