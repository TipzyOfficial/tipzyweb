import { memo, useCallback, useContext, useEffect, useState } from "react";
import { UserSessionContext } from "../../lib/UserSessionContext";
import useWindowDimensions from "../../lib/useWindowDimensions";
import { router } from "../../App";
import { SongType } from "../../lib/song";
import { fetchWithToken } from "../..";
import TZButton from "../../components/TZButton";
import FlatList from "flatlist-react/lib";
import Song, { SongList, SongRenderItem } from "../../components/Song";
import { Colors, padding } from "../../lib/Constants";
import TZHeader from "../../components/TZHeader";

function PopularSongs(props: {}) {
  return (
    <div>
      Popular Songs
    </div>
  )
}

function ArtistProfile(props: {}) {
  return (
    <div>
      <PopularSongs></PopularSongs>

    </div>
  )
}
export default function ArtistInfo() {
  return (
    <div className={"App-body-top"}>
      <div style={headerTitleStyle}>
        <TZHeader title={"Album Title Goes Here"} />
      </div>
      <div style={bodyStyles}>
        <ArtistProfile></ArtistProfile>
      </div>


    </div>
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