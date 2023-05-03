import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { SpawnInfo, ZepetoPlayers, LocalPlayer } from 'ZEPETO.Character.Controller';
import { WorldService } from 'ZEPETO.World';

export default class CharacterController extends ZepetoScriptBehaviour {

    Start() {
        // [ZEPETO_ID]를 접속한 사람의 닉네임으로 설정
        // ZepetoPlayers.instance.CreatePlayerWithZepetoId("", "nhpe", new SpawnInfo(), true);
        
        // 월드에 접속한 유저 각각의 고유한 아이디로 Player를 생성
        ZepetoPlayers.instance.CreatePlayerWithUserId(WorldService.userId, new SpawnInfo(), true);
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            let _player : LocalPlayer = ZepetoPlayers.instance.LocalPlayer;
        });
    }

}