import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Time } from 'UnityEngine'

export default class Movement extends ZepetoScriptBehaviour {

    public movingTime : number = 0;     // 발판이 방향을 바꾸는 주기 (sec)
    public movingRangeX : number = 0;   // X축 방향으로 이동하는 범위
    public movingRangeY : number = 0;   // Y축 방향으로 이동하는 범위
    private delta : number = 0;         // deltaTime 값을 누적해서, 얼마의 시간이 흘렀는지를 판단
    private movingFlag : boolean = true;    // 어느 방향으로 움직일지 결정

    Update() {    
        // Time.deltaTime: 이전 프레임과 현재 프레임 사이의 시간 차이
        this.delta += Time.deltaTime;

        // 매 ~초마다 실행되는 코드
        if (this.delta >= this.movingTime) {
            this.delta = 0;
            this.movingFlag = !this.movingFlag;
        }

        // movingFlag가 참일 땐 정방향으로 움직임
        if (this.movingFlag) {
            this.transform.Translate(this.movingRangeX * Time.deltaTime, this.movingRangeY * Time.deltaTime, 0);
        } else {
            this.transform.Translate(-this.movingRangeX * Time.deltaTime, -this.movingRangeY * Time.deltaTime, 0);
        }
    }

}