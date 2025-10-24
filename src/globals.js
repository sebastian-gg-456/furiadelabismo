// globals.js
// Global variables

// Usar un objeto para poder modificar la propiedad desde otros módulos
var globals = {
    isEnglish: false,
};

// Exportar tanto el objeto como un getter/setter
export { globals };
export const isEnglish = globals.isEnglish;
export const setIsEnglish = (value) => {
    globals.isEnglish = value;
};
