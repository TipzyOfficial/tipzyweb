import { Spinner } from "react-activity"

export function DisplayOrLoading(props: {content: JSX.Element, condition: boolean, loadingScreen?: JSX.Element}) {
    const color = "#888"
    const LoadingScreen = () => props.loadingScreen ?? 
    <div style={{alignItems: 'center', justifyContent: 'center'}}>
        <Spinner/>
    </div>

    return( props.condition ?
        props.content
        : <LoadingScreen/>
    )
}