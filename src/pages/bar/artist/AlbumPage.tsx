import { memo, useCallback, useContext, useEffect, useState } from "react";
import { UserSessionContext } from "../../../lib/UserSessionContext";
import useWindowDimensions from "../../../lib/useWindowDimensions";
import { getCookies, router } from "../../../App";
import { AlbumType, ArtistType, SongType } from "../../../lib/song";
import { fetchWithToken } from "../../..";
import TZButton from "../../../components/TZButton";
import FlatList from "flatlist-react/lib";
import Song, { SongList, SongRenderItem } from "../../../components/Song";
import { Colors, padding, useFdim } from "../../../lib/Constants";
import TZHeader from "../../../components/TZHeader";
import { useLocation, useSearchParams } from "react-router-dom";
import { NotFoundPage } from "../NotFoundPage";
import { DisplayOrLoading } from "../../../components/DisplayOrLoading";
import { Spinner } from "react-bootstrap";
import { ScrollMenu } from 'react-horizontal-scrolling-menu';
import Album from "../../../components/Album";
import BackButton from "../../../components/BackButton";

const LoadingScreen = () => 
  <div className="App-header">
      <Spinner style={{color: Colors.primaryRegular, width: 75, height: 75}}/>
      <br></br>
      <span>Loading album information...</span>
  </div>;
  
export default function AlbumPage() {
  const usc = useContext(UserSessionContext);
  const [ready, setReady] = useState(false);
  const [songs, setSongs] = useState<SongType[]>([]);
  const cookies = getCookies();
  const barID: number | undefined = usc.barState.bar ? usc.barState.bar.id : cookies.get("bar_session");
  const fdim = useFdim();
  const songDims = fdim ? Math.max(Math.min(fdim/10, 75), 50) : 50;
  const albumDims = fdim ?  Math.max(Math.min(fdim/2, 200), 50) : 120;

  const loc = useLocation();
  const album: AlbumType | undefined = loc.state ? (loc.state.album ?? undefined ): undefined;


  // console.log("idname", artistID, artistName);

  async function fetchAlbum(id: string): Promise<ArtistType | undefined> {
    if(!barID) return;
    if(!album) return;

    await fetchWithToken(usc.user, `tipper/spotify/album/?business_id=${barID}&album_id=${id}`, "GET")
    .then(r => r.json())
    .then(json => {
        const data = json.data;
        console.log("album data", data);
        // console.log(album);
        const s: SongType[] = [];
        data.forEach((e: any) =>
            s.push({title: e.name, artists: album.artists, albumart: album.albumart, id: e.id, explicit: e.explicit})
        );
        console.log(s);
        setSongs(s);
    })
    .catch((e: Error) => console.log(`Error: ${e.message}`));
  }

  useEffect(() => {
    if(!album) { setReady(true); return; }
    fetchAlbum(album.id).then(() => setReady(true));
  }, [])

  if(!album) {
    return <NotFoundPage body="We can't seem to find that album." backPath={"/bar"}/>
  }

  const TSMemo = memo(SongList)

  function handleBackClick() {
    router.navigate(-1);
  }

  return (
    <DisplayOrLoading condition={ready} loadingScreen={<LoadingScreen/>}>
      <div className={"App-body-top"}>
        <TZHeader title={album.title} 
          leftComponent={
            <BackButton onClick={handleBackClick}></BackButton>
          }
        />
        <div style={{width: '100%', paddingBottom: padding*2}}>
          <div style={{width: '100%', padding: padding}}>
            <div style={{width: '100%', display: 'flex', flexDirection: 'column'}}>
                <div style={{width: '100%', justifyContent: 'center', display: 'flex'}}>
                    <img src={album.albumart} alt={album.title} style={{width: albumDims, height: albumDims}}></img>
                </div>
                <span className="App-subtitle" style={{
                    textAlign: 'center', width: '100%', padding: padding
                    }}>{album.title}</span>
                <div style={{padding: padding}}></div>
                <TSMemo noImage songs={songs} dims={songDims}></TSMemo>
            </div>
          </div>
        </div>
      </div>
    </DisplayOrLoading>
  )
}
const bodyStyles: React.CSSProperties = {
  paddingRight: padding,
  paddingLeft: padding,
  width: "100%",
  maxWidth: "600px",
  margin: '0 auto'
};
const headerTitleStyle: React.CSSProperties = {
  flexGrow: 1,
  textAlign: 'center',
  fontSize: '24px',
  color: 'white',
  fontWeight: 'bold',
};