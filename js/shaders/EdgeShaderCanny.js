/* Written by Arefin Mohiuddin - graphics n00b */

THREE.EdgeShaderCanny = {

	uniforms: {
		"tDiffuse": { type: "t", value: null },
		"edgewidth": { type: "f", value: 1.25 },
		"uWindow": { type: "v2", value: new THREE.Vector2(800.0, 400.0) }  // size of canvas
	},

	vertexShader: [
		"varying vec2 vUv;",

		"void main() {",
			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	].join("\n"),

	fragmentShader: [
		"uniform sampler2D tDiffuse;",
		"uniform vec2 uWindow;",
		"uniform float edgewidth;",
		"varying vec2 vUv;",
		"float edge_width_pixels = edgewidth;",  // range of pixels to test .5 gives a narrow line, 4.0 gives a fat line
		"vec2 offset  = 1.0 / (uWindow / edge_width_pixels );",  // size of pixel, in range 0-1

		"float makeGrayShade(vec4 colorIn) {",
		"	float grayIn = ( colorIn.r + colorIn.g + colorIn.b ) / 3.0;",
		// "	float grayIn = dot(colorIn.rgb, vec3(0.299, 0.587, 0.114));",  // makes a brighter grayscale
		"	float step = 1.0 / 4.0;",
		"	float grayOut;",
		"	if ( grayIn < 1.0 * step ) {",
		"	    grayOut = 0.0;",
		"	}",
		"	else if( grayIn < 2.0 * step ) {",
		"	    grayOut = 1.0 * step;",
		"	}",
		"	else if( grayIn < 3.0 * step ) {",
		"	    grayOut = 2.0 * step;",
		"	}",
		"	else if( grayIn < 4.0 * step ) {",
		"	    grayOut = 3.0 * step;",
		"	}",
		"	else {",
		"	    grayOut = 1.0;",
		"	}",
		// "	return grayOut;",
		"	return grayIn;",
		"}",

		"bool checkEdge(sampler2D img, vec2 uv, vec2 pixel_offset, float sensitivity) {",
		"	vec2 pixelRight_Coord = uv + vec2(pixel_offset.x, 0.0);",
		"	vec2 pixelLeft_Coord = uv + vec2(-pixel_offset.x, 0.0);",
		"	vec2 pixelTop_Coord = uv + vec2(0.0, pixel_offset.y);",
		"	vec2 pixelBottom_Coord = uv + vec2(0.0, -pixel_offset.y);",
		"	vec2 gradient = vec2( length(texture2D(img,pixelRight_Coord).xyz - texture2D(img,pixelLeft_Coord).xyz), ",
		"						  length(texture2D(img,pixelTop_Coord).xyz - texture2D(img,pixelBottom_Coord).xyz) );",
		"	return (length(gradient) > sensitivity);",
		"}",

		"void main() {",
		"	vec4 color = texture2D( tDiffuse, vUv );",
		// " 	float grayShade = makeGrayShade(color);",
		" 	bool isEdge = checkEdge(tDiffuse, vUv, offset, .3);",

		"	if (isEdge) {",
		"		gl_FragColor = vec4(0., 0., 0., 1.0);",  // edge color
		"	}",
		// "	else {",
		// // "		if (color.g == 1.0)",
		// // "		    gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);",		// discard green backround (mark it with green)
		// "		if (color.a == 0.0)",
		// "		    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);",		// preserve transparency
		// "		else {",
		// "			gl_FragColor = vec4( grayShade, grayShade, grayShade, 1.0);", 	// fill in faces with gray tones
		// "		}",
		// "	}",
		"}" 
	].join("\n")

};
