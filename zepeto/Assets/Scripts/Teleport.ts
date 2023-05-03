import { Collider, Quaternion, Vector3 } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class Teleport extends ZepetoScriptBehaviour {

    private Player: ZepetoCharacter;

    Start() {
        // 제페토 플레이어를 불러오는지 Listener가 듣는 코드 (Single Play)
        // 로컬 플레이어가 정상적으로 생성되면, 그 플레이어를 this.Player로 설정
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.Player = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        });
    }

    // 이 게임 오브젝트(포탈)의 트리거에 다른 물체가 닿으면 실행
    OnTriggerEnter(collider: Collider) {
        // 1. Start() 함수에서 정상적으로 플레이어를 불러오지 못하거나
        // 2. 포탈과 충돌한 객체가 플레이어가 아니면 종료
        if (this.Player == null || collider.gameObject != this.Player.gameObject)
            return;

        // 3. Teleport(위치, 회전값): 
        this.Player.Teleport(new Vector3(0, 0, 0), Quaternion.identity);
    }

}