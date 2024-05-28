import useWindowDimensions from "./useWindowDimensions";

export const Colors =  {
    background: '#17171E',
    text: '#FFF',
    primaryLight: '#FCC679',
    primaryRegular: '#FA9D17',
    primaryDark: '#df8605',
    secondaryLight: '#e293ae',
    secondaryRegular: '#d5648b',
    secondaryDark: '#ae2f5b',
    tertiaryLight: '#4DBC9E',
    tertiaryRegular: '#276756',
    tertiaryDark: '#194237',
}

export const radius = 10;
export const padding = 12;

export const useFdim = () => {
    const window = useWindowDimensions();
    const fdim = window.height && window.width ? Math.min(window.height*0.9, window.width) : 1000;  
    return fdim;  
}
