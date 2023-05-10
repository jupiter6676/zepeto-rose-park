import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class Rotator extends ZepetoScriptBehaviour {

    // 각 축을 기준으로 회전하는 속도
    // SerializeField는 어떻게 해야 할까..
    public rotatorX : number = 0;
    public rotatorY : number = 0;
    public rotatorZ : number = 0;

    Start() {    

    }

    Update() {
        // this: 이 컴포넌트가 적용된 오브젝트
        // transform.Rotate(x, y, z): 매 프레임마다 -축을 기준으로, -의 속도로 회전
        this.transform.Rotate(this.rotatorX, this.rotatorY, this.rotatorZ);
    }

}