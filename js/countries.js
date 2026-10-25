// Country names used by the submission form dropdown and the map.
// The same list is in data/countries.txt so you can paste it into Google Forms.
window.NGC_COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia",
  "Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo (DRC)","Congo (Republic)",
  "Costa Rica","Côte d'Ivoire","Croatia","Cuba","Cyprus","Czechia","Denmark","Djibouti","Dominica","Dominican Republic",
  "Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland",
  "France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea",
  "Guinea-Bissau","Guyana","Haiti","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran",
  "Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati",
  "Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein",
  "Lithuania","Luxembourg","Macau","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands",
  "Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique",
  "Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea",
  "North Macedonia","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru",
  "Philippines","Poland","Portugal","Puerto Rico","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia",
  "Saint Vincent and the Grenadines","Samoa","San Marino","São Tomé and Príncipe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore",
  "Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan",
  "Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo",
  "Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom",
  "United States","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

// Form name -> name used inside the world map data.
window.NGC_COUNTRY_ALIASES = {
  "united states": "United States of America",
  "usa": "United States of America",
  "us": "United States of America",
  "united states of america": "United States of America",
  "uk": "United Kingdom",
  "england": "United Kingdom",
  "scotland": "United Kingdom",
  "wales": "United Kingdom",
  "bahamas": "The Bahamas",
  "congo (drc)": "Democratic Republic of the Congo",
  "drc": "Democratic Republic of the Congo",
  "congo (republic)": "Republic of the Congo",
  "cote d'ivoire": "Ivory Coast",
  "czechia": "Czech Republic",
  "eswatini": "Swaziland",
  "guinea-bissau": "Guinea Bissau",
  "north macedonia": "Macedonia",
  "serbia": "Republic of Serbia",
  "tanzania": "United Republic of Tanzania",
  "timor-leste": "East Timor",
  "palestine": "West Bank",
  "turkiye": "Turkey",
  "viet nam": "Vietnam"
};

// [longitude, latitude] for places too small to appear on the world map outline.
window.NGC_COUNTRY_POINTS = {
  "Andorra": [1.6, 42.5], "Antigua and Barbuda": [-61.8, 17.1], "Bahrain": [50.6, 26.0], "Barbados": [-59.5, 13.2],
  "Cabo Verde": [-23.6, 15.1], "Comoros": [43.9, -11.9], "Dominica": [-61.4, 15.4], "Grenada": [-61.7, 12.1],
  "Hong Kong": [114.2, 22.3], "Kiribati": [-157.4, 1.9], "Liechtenstein": [9.55, 47.15], "Macau": [113.55, 22.2],
  "Maldives": [73.5, 3.2], "Malta": [14.4, 35.9], "Marshall Islands": [171.2, 7.1], "Mauritius": [57.6, -20.3],
  "Micronesia": [158.2, 6.9], "Monaco": [7.42, 43.74], "Nauru": [166.9, -0.5], "Palau": [134.6, 7.5],
  "Saint Kitts and Nevis": [-62.75, 17.3], "Saint Lucia": [-60.97, 13.9], "Saint Vincent and the Grenadines": [-61.2, 13.25],
  "Samoa": [-172.1, -13.8], "San Marino": [12.45, 43.94], "São Tomé and Príncipe": [6.6, 0.25], "Seychelles": [55.45, -4.65],
  "Singapore": [103.82, 1.35], "Tonga": [-175.2, -21.2], "Tuvalu": [179.2, -8.5], "Vatican City": [12.45, 41.9],
  "Puerto Rico": [-66.5, 18.2], "Taiwan": [121.0, 23.7], "Fiji": [178.0, -17.8], "Luxembourg": [6.13, 49.8],
  "Trinidad and Tobago": [-61.3, 10.5], "Brunei": [114.7, 4.5], "Cyprus": [33.2, 35.0], "Jamaica": [-77.3, 18.1],
  "Lebanon": [35.85, 33.9], "Qatar": [51.2, 25.3], "Kosovo": [20.9, 42.6], "Montenegro": [19.3, 42.7],
  "Palestine": [35.2, 31.9], "Gambia": [-15.4, 13.45], "Solomon Islands": [160.2, -9.6], "Vanuatu": [167.0, -15.4]
};
