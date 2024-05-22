import { router } from "../../App";
import TZButton from "../../components/TZButton";

export default function SongSearch() {
    return(
        <div style={{width: '100%', display: 'flex', flexDirection: 'column'}}>
            <TZButton onClick={() => router.navigate("/bar")}></TZButton>
        </div>
    )
}