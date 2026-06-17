import React, { useState, useEffect, useRef } from "react";
import {
  Cloud,
  Wind,
  Zap,
  RotateCcw,
  Sparkles,
  BookOpen,
  Layers,
  Settings2,
  HelpCircle,
  Info,
  Calendar,
  Play,
  Flame,
  Snowflake,
  Check,
  Copy,
  Download,
  ChevronRight,
  AlertCircle,
  Compass,
  Activity,
  Cpu,
  Sword,
  Volume2,
  VolumeX,
  Shield,
  Trophy,
  Timer
} from "lucide-react";
import { synAndAmbiance } from "./utils/audio";

// Google Gemini API proxy route (Full-stack architecture safeguard)
const GEMINI_API_ROUTE = "/api/gemini/generate-spec";

// Types definition for our interactive game architect application
export interface StageConfig {
  id: number;
  name: string;
  difficulty: "Beginner" | "Medium" | "Hard" | "Expert" | "Legendary";
  weatherType: string;
  humidity: number; // %
  windSpeed: number; // m/s
  windDirection: string;
  temperature: number; // °C
  elasticity: number; // %
  hazardLevel: "Low" | "Moderate" | "High" | "Extreme";
  description: string;
  gimmickIdea: string;
}

export interface EnemyNPC {
  id: number;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: "NORMAL" | "FROZEN" | "ELECTRIFIED" | "BURNED";
  hp: number;
  maxHp: number;
  floatOffset: number;
  damageCooldown: number;
  shatterProgress?: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number; // frames count (e.g. 60)
}

// Five Preset Stages reflecting progressive levels of difficulty and environments
export const PRESET_STAGES: StageConfig[] = [
  {
    id: 1,
    name: "第一天区：そよ風の平原 (Zephyr Meadow)",
    difficulty: "Beginner",
    weatherType: "Fair-weather Cumulus (わた雲)",
    humidity: 45,
    windSpeed: 6,
    windDirection: "South-West",
    temperature: 18,
    elasticity: 40,
    hazardLevel: "Low",
    description: "穏やかな上昇気流が吹き抜けるチュートリアルエリア。雲の弾性を利用した大ジャンプの基礎や、気流に沿って滑空するフライト感覚を覚えるのに最適。",
    gimmickIdea: "点在する綿雲を下から勢いよく押し上げる（雲カッター/突き上げ）ことで、高所に浮遊する古代の風車ゲートを起動して進路を開く。"
  },
  {
    id: 2,
    name: "第二天区：黄昏の積雲峡 (Twilight Cumulus Canyon)",
    difficulty: "Medium",
    weatherType: "Altocumulus (ひつじ雲)",
    humidity: 60,
    windSpeed: 14,
    windDirection: "West",
    temperature: 12,
    elasticity: 55,
    hazardLevel: "Moderate",
    description: "谷間から吹き出す予測不能な突風（サーマルコラム）と、幾重にも連なるちぎれ雲が特徴的な美しい夕暮れの渓谷。スピード維持コントロールが試される。",
    gimmickIdea: "雲をグライドで踏みつけて反発エネルギーを連鎖。雲同士を近くに変形させ、足場をジャンプで繋げて渓谷の防風壁を飛び越える。"
  },
  {
    id: 3,
    name: "第三天区：焦熱の蒸気天廊 (Ashen Vapor Gallery)",
    difficulty: "Hard",
    weatherType: "Thermal Evaporation (上昇蒸気)",
    humidity: 85,
    windSpeed: 22,
    windDirection: "Updraft (Ascending)",
    temperature: 42,
    elasticity: 30,
    hazardLevel: "High",
    description: "高熱の溶岩煙から発生した、熱せられた超高温水蒸気の領域。雲が急速に蒸発しやすいため、迅速なフライトルート構築が必要とされる難関ステージ。",
    gimmickIdea: "熱せられて過熱状態の雲モジュールに「冷却属性スキル（Cryo）」を当てて一瞬で相転移（凝縮）。雲を一瞬だけ冷やして『固体の足場』に変え、崩れる前にダッシュで渡る。"
  },
  {
    id: 4,
    name: "第四天区：白銀の永久氷霧 (Glacial Frost-Mist Sky)",
    difficulty: "Hard",
    weatherType: "Overcooled Ice Clouds (過冷却氷晶雲)",
    humidity: 90,
    windSpeed: 18,
    windDirection: "North-West",
    temperature: -18,
    elasticity: 70,
    hazardLevel: "High",
    description: "氷点下の極寒地帯。雲に触れると「過冷却」状態になり、天候変化スキルを急激に冷やすことで足場を弾性ソリッド（完全氷結）に硬化できるステージ。",
    gimmickIdea: "物理波形を伝播させ、波に揺れる巨大な雲のメッシュを瞬時にカチコチに凍結。反り立つビッグウェーブの形のままで氷の斜面を作り、スライドダッシュするパズル。"
  },
  {
    id: 5,
    name: "第五天区：神鳴の嵐芯 (Tempest Core)",
    difficulty: "Expert",
    weatherType: "Cumulonimbus (積乱雲)",
    humidity: 98,
    windSpeed: 32,
    windDirection: "Rotational (Cyclone)",
    temperature: 5,
    elasticity: 65,
    hazardLevel: "Extreme",
    description: "暴風雨と凄まじい雷光が織りなす巨大な「積乱雲」のステージ。雲の内部に蓄積された強力な電荷と、ランダムに発生する落雷、ダウンバーストを制する最終試練。",
    gimmickIdea: "雲の形状を帯電シールド（パラドックス形状）へ手動変形させ、敵のプラズマビーム攻撃を集光。エネルギーを満タンにしてから自爆させ、強固な防風ゲートを破壊するギミック。"
  }
];

// Default baseline specs baked completely into the app
const BASELINE_SPECS = {
  physics: `### 【1】物理演算を用いた雲の形状変化システム (Cloud Deformation Architecture)

雲を単純なモデルではなく、粘弾性流体（Viscoelastic Fluid）とマクロパーティクル群体をハイブリッドした動的2Dグリッドとしてシミュレートします。

#### A. 頂点変形アルゴリズム (Vertex Displacement Formula)
雲のマクロ弾性挙動を表現するため、頂点位置 $P_i$ は外力に対して以下のバネ・ダンパー質量系、およびナビエ・ストークスの微小影響場によってダイナミックに変位します。

$$F_{elast\_i} = -k \cdot (P_i - P_{0\_i}) - c \cdot V_i$$

ここで、$P_{0\_i}$ は原形配置、$k$ は雲の硬度/弾性係数（Elasticity）、$c$ は空気抵抗（減衰）係数です。
プレイヤーが高速で雲に衝突した際、衝突点近傍の頂点は以下のガウス減衰窓関数 $W(d)$ を用いて滑らかに変形します：

$$W(d) = \\exp\\left( -\\frac{d^2}{2\\sigma^2} \\right)$$

$$P'_i = P_i + \\mathbf{N}_i \\cdot \\left[ I_{impact} \\cdot W(\\text{dist}(P_i, P_{hit})) \\right]$$

#### B. 頂点シェーダー構造 (WebGL / Custom Shader)
頂点プログラムでは、2Dシンプレックスノイズ（あるいは２次元パーリンノイズ）を用いて、時間の経過とともに表面が揺らぐリアルなソフト雲を動的生成します。
\`\`\`glsl
// GLSL Vertex Shader Snippet for Cloud Surface Deformation
uniform float uTime;
uniform float uDeformStrength;
uniform vec2 uDeformationCenter;
uniform float uDeformRadius;

varying vec2 vTexCoord;

float snoise2D(vec2 v); // 2D Simplex Noise function

void main() {
    vec2 worldPosition = position.xy;
    
    // Calculate dynamic vertex wobble based on weather humidity and wind
    float noiseVal = snoise2D(worldPosition * 0.15 + vec2(uTime * 0.4, uTime * 0.2));
    vec2 updatedPosition = position.xy + vec2(0.0, noiseVal * 0.25);
    
    // Apply local physical impact deformation (deformed by player actions)
    float distToPlayer = distance(worldPosition, uDeformationCenter);
    if (distToPlayer < uDeformRadius) {
        float factor = 1.0 - (distToPlayer / uDeformRadius);
        float smoothFactor = factor * factor * (3.0 - 2.0 * factor); // Smoothstep
        updatedPosition -= normal * (smoothFactor * uDeformStrength);
    }
    
    vec4 mvPosition = modelViewMatrix * vec4(updatedPosition, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
\`\`\`

#### C. メッシュ切断型・形状変化分離手法 (Metaball & Marching Cubes)
プレイヤーの「雲カッター（真空の風刃）」や「ビーム」を浴びた際、雲は幾何学的に鋭利に切り裂かれるか、あるいは「メタボール（Metaballs）」のしきい値変化と **Marching Cubes アルゴリズム** によって、2つの独立した小さなちぎれ雲（Sub-mesplets）へと動的に分離します。これにより「ちぎり取った雲を武器として投げる」「巨大な雲を切り分けて複数の足場に分割する」などの高度な物理パズルをゲーム内に提供します。`,

  movement: `### 【2】直感的な空中移動操作 (Kinetic Aerial Locomotion Specs)

空中を360度シミュレートした慣性ベースのフライトモデルです。単なる全方位移動ではなく、「風の流れ」を掴んでリズミカルに滑空するメカニクスを中核とします。

#### A. 3次元空気力学に基づく滑空方程式 (Gliding & Aerodynamics)
プレイヤーキャラクター の速度ベクトルを $\\mathbf{V}$、姿勢の前方ベクトルを $\\mathbf{F}$ とします。

1. **揚力 (Lift Force):**
   $$\\mathbf{F}_{lift} = \\frac{1}{2} C_L \\cdot \\rho \\cdot |\\mathbf{V}|^2 \\cdot \\mathbf{U}_{lift}$$
   ここで $\\rho$ は気圧（空気密度：湿度の二乗に比例）、$C_L$ はプレイヤーの迎角に依存する揚力係数、$\\mathbf{U}_{lift}$ は速度ベクトルと翼（プレイヤーの手足の羽）に対して垂直上方に働くベクトル。

2. **抗力 (Drag Force):**
   $$\\mathbf{F}_{drag} = -\\frac{1}{2} C_D \\cdot \\rho \\cdot |\\mathbf{V}| \\cdot \\mathbf{V}$$

3. **風からのエネルギー伝達（サーフィン推進）:**
   プレイヤーの「雲サーフモード」発動時、足元の雲の表層気流（Wind Vector: $\\mathbf{W}$）に対して、以下の同調ブーストが加わります：
   $$\\mathbf{V}_{surf\_boost} = \\mathbf{W} \\cdot \\cos(\\theta) \\cdot \\gamma_{friction}$$
   （これにより逆風をかき消す、ないし追い風時に超長距離をワープするようなハイスピード滑走アクションが成立）

#### B. 操作系ステートマシンと実装 boilerplate (State Machine)

\`\`\`typescript
enum AerialState {
  FREE_FALL = "FREE_FALL", // 通常の重力落下
  GLIDING = "GLIDING",     // 滑空：風と姿勢を制御し急高度上昇・降下可能
  CLOUD_SURFing = "SURF",  // 雲サーフィン：雲の形に沿って高速移動
  WIND_BOOSTED = "BOOST",  // 風流気流によるバースト状態
  STALL = "STALL"          // 失速：過度な迎角や衝撃で制御を一時喪失
}

interface CharacterPhysics {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  rotation: { pitch: number; yaw: number; roll: number };
  state: AerialState;
  stallTimer: number;
}

// 物理演算ループ内でのフライト制御マトリクス
function updateCharacterPhysics(
  char: CharacterPhysics,
  input: { forward: number; strafe: number; tilt: number; jumpAction: boolean },
  wind: { x: number; y: number; z: number },
  currentCloudDensity: number,
  deltaTime: number
) {
  // 1. 各種外力の算出
  const gravity = -9.81; // m/s²
  const dragCoeff = char.state === AerialState.GLIDING ? 0.05 : 0.2;
  const liftCoeff = char.state === AerialState.GLIDING ? 0.35 : 0.0;
  
  // 2. 状態遷移の監視
  if (char.state === AerialState.GLIDING && Math.abs(char.rotation.pitch) > 75) {
    char.state = AerialState.STALL;
    char.stallTimer = 1.5; // 1.5秒間の失速ペナルティ
  }
  
  if (char.state === AerialState.STALL) {
    char.stallTimer -= deltaTime;
    if (char.stallTimer <= 0) char.state = AerialState.FREE_FALL;
  }
  
  // 3. 雲サーフィンへの移行検知 (密度としきい値)
  if (currentCloudDensity > 0.65 && input.jumpAction && char.state !== AerialState.STALL) {
    char.state = AerialState.CLOUD_SURFing;
  } else if (currentCloudDensity < 0.2 && char.state === AerialState.CLOUD_SURFing) {
    char.state = AerialState.GLIDING;
  }
  
  // 4. 力の加算と位置積分
  const force = { x: 0, y: gravity, z: 0 };
  
  // 空力抵抗
  force.x -= dragCoeff * char.velocity.x;
  force.y -= dragCoeff * char.velocity.y;
  force.z -= dragCoeff * char.velocity.z;
  
  // 風圧
  const windRel = {
    x: wind.x - char.velocity.x,
    y: wind.y - char.velocity.y,
    z: wind.z - char.velocity.z
  };
  force.x += windRel.x * 0.15;
  force.y += windRel.y * 0.15;
  force.z += windRel.z * 0.15;
  
  // 雲サーフィン時の摩擦＆表面推進
  if (char.state === AerialState.CLOUD_SURFing) {
    force.y = 0; // 高度固定・または雲表面スナップ
    force.x += char.rotation.roll * 5.0; // 傾き入力によるカービング推進
  }
  
  // オイラー法（またはVerlet）積分
  char.velocity.x += force.x * deltaTime;
  char.velocity.y += force.y * deltaTime;
  char.velocity.z += force.z * deltaTime;
  
  char.position.x += char.velocity.x * deltaTime;
  char.position.y += char.velocity.y * deltaTime;
  char.position.z += char.velocity.z * deltaTime;
}
\`\`\`

#### C. フィードバック表現
- **滑空速度線粒子ミスト**：時速50m/sを突破した際、プレイヤー周辺に筋状の気流パーティクルが自動整列して後方に流れ去り、圧倒的な速度感覚を提示します。
- **音響ダイナミクス**：飛行速度、または風の強さに追従し、重低音を帯びた「ゴオーー」という高精細な風圧風鳴り音階エフェクトをリアルタイム変調します。`,

  gimmick: `### 【3】天候変化マトリクス＆ギミック設計 (Adaptive Weather & Puzzle Matrix)

プレイヤーは雲を手動、あるいは環境反応をトリガーとして「急速に状態変化」させることができます。天候そのものを『変形可能な立体構造物』として物理利用します。

#### A. 天候状態変化サイクル (Phase Transition Cycles)
プレイヤーは4つの性質（「冷却」「熱放射」「帯電」「真空気流」）の元素弾を、自身が飛行中に操る雲にぶつけることで、ミクロ相転移を引き起こせます：

| 初期状態 (Cloud Class) | プレイヤーの刺激 (Elements) | 新状態 (Result State) | 物理特性・ギミック |
| :--- | :--- | :--- | :--- |
| **Cumulus (積雲 / 常温)** | 冷却 (Cryo Burst) | **Glacial (氷結雲)** | 摩擦係数が0付近になる、超滑るソリッド足場。重い。 |
| **Cumulus (積雲 / 常温)** | 熱放射 (Pyro Burst) | **Vaporize (蒸発煙)** | 雲が消滅し、急激な「上昇気流」を発生。プレイヤーはフライトブースト。 |
| **Nimbus (雨雲 / 多湿)** | 帯電 (Electro Burst) | **Storm Battery (雷電極)** | プラズマを蓄積・反射するワイヤレス伝動。敵への致死放電トラップ。 |
| **Stratus (層雲 / 静止)** | 真空気流 (Gale Siphon) | **Tornado Core (誘導竜巻)** | 周辺の小物や敵を引き寄せて巻き上げるクレーターを形成。 |

#### B. 具体的な環境パズルシーケンス (Level Design Gimmicks)

1. **「蒸気タワー・ローンチ」パズル：**
   - **状況：** 上方に強固な遮るシャッター（冷たい氷塊）があり、通常の滑空ジャンプでは到達できない。
   - **解法：** 足元の巨大な積雲に火属性スキルを放ち、一瞬で「一斉蒸発」させる。すると、急速上昇気流（サーマル・コラム）が発生。
   - **物理結果：** プレイヤーはこの上昇風に飛び乗ると、滑空ステートが「WIND_BOOSTED」に突入。凄まじい上向運動エネルギーを得てシャッターを突き破り、氷塊をも溶かしながら上部天区へジャンプを成功させられる。

2. **「プラズマ・カタパルト」パズル：**
   - **状況：** 巨大な雷雲（極性放電を持った積乱雲）が一定間隔でスパークを出し、進路を阻んでいる。
   - **解法：** 雲の形状を丸型（球体）に変調し、それを磁化するように電気属性で帯電させる。
   - **物理結果：** バインディングワイヤとなって、落雷が雲の球体を中継。落雷エネルギーを受け取った雲が一時的に磁気反発エリアを形成し、プレイヤーがそこに飛び込むと、金属製グライダーのように超高速の逆方向放電カタパルト射出をされる。`,

  combat: `### 【5】雲と天候を用いた宿敵討伐物理力学 (Sovereign Combat & Enemy Desolation Mechanics)

本ゲームにおいて戦闘は単なる追突や通常弾による狙撃ではなく、**「雲、大気条件、およびエレメントの化学変化の熱力学物理」を組み合わせた宿敵の崩壊**をコアとしています。

#### A. 雲トランポリンプレス (Viscoelastic Trampoline Wave Emission)
厚い「積雲(Cumulus)」にプレイヤーが超高速急降下した際、雲メッシュが変形限界 $\Delta y_{max}$ に到達した瞬間に上向バネ復帰反動と並行して「指向性圧縮パルス（Shock Wave Cluster）」が放射されます。

$$F_{shocks} = P_{weight} \cdot k_{elastic} \cdot \left(\frac{dy}{dt}\right)$$

雲の上の敵ターゲットはこれによって一時的に姿勢を喪失、推進力を奪われ、以下の「浮遊不能ステート（FLIGHT_MUTED）」になります：
- スリップダメージ係数 $D = |F_{shocks}| \times 0.25$ の発生。
- 雲屑の飛散による短時間視界デバフを適用。

#### B. 降雨連鎖帯電現象 (Wet Phase Lightning Chain Mechanics)
大気湿度が75%以上の「多湿状態（Nimbus）」または降雨エリアで「落雷帯電 (Electro)」をぶつけたとき、空気抵抗率および湿った皮膚表面が極小となり、雷撃プラズマは最大 $N$ 人の敵にチェーンアーク（等電位アーク放電）を描いて瞬間伝播します。

$$V_{chain}(r) = V_0 \cdot \exp(-\alpha \cdot r) \cdot \gamma_{moisture}$$

- **物理効果：** 雷光により敵（ロボット・天空モンスター）は動作クロックをショートさせられ、3秒間動きが停止（ELECTRIFIED）。受けるダメージが 3.5倍 に跳ね上がります。

#### C. 氷結質量増大落体破砕法 (Cryo Shatter Downward Gravity Fracture)
「極寒凍結 (Cryo)」を受けた敵ノードは、内部水分子が一瞬で固相になり体積と質量が 3倍 に激変します。

$$M'_{item} = 3.0 \cdot M_{item}$$

揚力係数 $C_L$ が瞬時に $0$ にリセット。放物線墜落時速 120km/h を誇り、最下部に激突、もしくはプレイヤーの「風の真空カッター」がヒットした際、以下の脆性破壊条件（Griffith's Criterion）を満たし、一瞬で2Dスプライトが12ピースに粉砕（Shatter & Freeze Destroy）されます。`,

  "ai-prompt": `### 【他のAIにそのまま渡すためのプロンプト】(Perfect System Spec & Boilerplate Generator Prompt)

下記のプロンプトブロックをまるごとコピペし、ChatGPT (GPT-4), Claude 3.5 Sonnet, Gemini Pro等に渡すことで、この2D雲アクション仕様を完璧に満たしたTypeScriptとHTML5 Canvas 2Dのプレイ可能ゲームモジュール（ボイラープレート）が生成されます。

---

\`\`\`text
You are an exceptionally skilled 2D Front-end Game Developer specializing in real-time physics simulators, HTML5 Canvas 2D simulation, and tight player controls.
Please develop a complete, fully functional single-file React component (using TypeScript, HTML5 Canvas 2D simulation, and Lucide icons) that implements the primary system for "AEROSCULPT" (Cloud Physics Action Game).

Requirements:
1. UI Setup: A stunning cyberpunk-sky theme, displaying real-time variables of the cloud environment (Humidity, Wind Speed, Vector Grid representation, and Player Gliding state).
2. Cloud Deformation Simulation:
   - Provide an interactive, high-fidelity physical canvas simulating a viscoelastic soft-body cloud lattice with spring-damper equations.
   - The cloud must distort gracefully when impacted by the glider or grabbed by mouse drag inputs.
3. Flying Glider Locomotion Control Simulator:
   - Simulates a player character (visible as an aerodynamic glider or fluid node) flying through the air.
   - Controls: Pitch / Yaw / Roll buttons or Direct WASD/Arrow simulation to glide, dive (gathering momentum), and slide/surf inside humid clouds along the wave crests.
4. Floating Enemy Targets with Element Combat Interactions:
   - Introduce fully functioning floating enemy target nodes (Aero Sentinel drones, Levitation core) initialized with health bars and coordinates.
   - Implement real-time hit detection:
     - If the player slams the cloud right below the enemy, they are hit by the cloud's viscoelastic recoil force (popping them upwards with damage).
     - Triggering Pyro (Heat) vaporizes the cloud into a fiery thermal draft, causing enemies to burn and float vertically.
     - Triggering Cryo (Deep Freeze) freezes the cloud and freezes the enemies, causing them to fall with 3x gravity and shatter violently at the bottom.
     - Triggering Electro electrifies the cloud and creates chaining lightning arcs that stun and paralyze all enemies.
5. Interactive Sandbox Debug Interface:
   - Let users modify Humidity (%), Wind Speed (m/s), Climate Type, and Elastic Restoring Force using sliders, instantly updating physical simulation parameters.
\`\`\`
`
};

export default function App() {
  const [selectedStage, setSelectedStage] = useState<StageConfig>(PRESET_STAGES[0]);
  const [currentTab, setCurrentTab] = useState<"sandbox" | "docs">("sandbox");
  const [activeDocSubTab, setActiveDocSubTab] = useState<"physics" | "movement" | "gimmick" | "combat" | "prompt">("physics");

  // Playable Game Modes: "visualizer" (Relaxed sandbox) | "arcade" (Time attack combat conquest challenge)
  const [gamePlayMode, setGamePlayMode] = useState<"visualizer" | "arcade">("visualizer");
  const [gameActive, setGameActive] = useState(false);
  const [arcadeScore, setArcadeScore] = useState(0);
  const [arcadeCombo, setArcadeCombo] = useState(1);
  const [arcadeComboSec, setArcadeComboSec] = useState(0.0);
  const [arcadeIntegrity, setArcadeIntegrity] = useState(100);
  const [arcadeTime, setArcadeTime] = useState(60);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem("AEROSCULPT_high_score") || "0");
    } catch {
      return 0;
    }
  });

  // Sound Synth States
  const [isAudioMuted, setIsAudioMuted] = useState(true); // default muted to respect browser autoclave
  const [isBgmOn, setIsBgmOn] = useState(false);

  // Editable parameters initialized to the selected stage values
  const [humidity, setHumidity] = useState(selectedStage.humidity);
  const [windSpeed, setWindSpeed] = useState(selectedStage.windSpeed);
  const [windDirection, setWindDirection] = useState(selectedStage.windDirection);
  const [temperature, setTemperature] = useState(selectedStage.temperature);
  const [elasticity, setElasticity] = useState(selectedStage.elasticity);
  const [customDirectives, setCustomDirectives] = useState(
    "粘弾性バネモデルの各グリッド点をさらに滑らかにするため、平均曲率フロー（Mean Curvature Flow）によるスムージングも追加して。また、雲サーフィン時の滑走痕（トレイルパーティクル）が気流に沿って美しく流れる仕様を盛り込んでください。"
  );

  // Specification Generation states
  const [generatedSpecs, setGeneratedSpecs] = useState<Record<string, string>>(BASELINE_SPECS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingError, setGeneratingError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Interactive floating enemy NPCs
  const [enemies, setEnemies] = useState<EnemyNPC[]>([
    { id: 1, name: "微風の偵察ドローン (Aero Sentinel)", x: 260, y: 150, vx: 0.6, vy: 0, state: "NORMAL", hp: 100, maxHp: 100, floatOffset: 0, damageCooldown: 0 },
    { id: 2, name: "浮遊重力核 (Levitate Core)", x: 580, y: 110, vx: -0.4, vy: 0, state: "NORMAL", hp: 150, maxHp: 150, floatOffset: Math.PI / 3, damageCooldown: 0 },
    { id: 3, name: "雨雲喰らい (Nimbus Siphon)", x: 420, y: 200, vx: -0.2, vy: 0, state: "NORMAL", hp: 120, maxHp: 120, floatOffset: Math.PI, damageCooldown: 0 }
  ]);

  // Floating text array for arcade style damage feedbacks
  const [damageTexts, setDamageTexts] = useState<FloatingText[]>([]);

  const [playerPos, setPlayerPos] = useState({ x: 300, y: 150 });
  const [playerVel, setPlayerVel] = useState({ x: 2.2, y: 0.4 });
  const [playerState, setPlayerState] = useState<"GLIDING" | "SURFING" | "STALL" | "BOOST">("GLIDING");
  const [playerPitch, setPlayerPitch] = useState(15); // degrees
  const [speedVal, setSpeedVal] = useState(24);
  const [liftPower, setLiftPower] = useState(12);
  const [weatherPreset, setWeatherPreset] = useState<"normal" | "frozen" | "electrified" | "vaporize">("normal");

  // Sync state variables when selected stage changes
  useEffect(() => {
    setHumidity(selectedStage.humidity);
    setWindSpeed(selectedStage.windSpeed);
    setWindDirection(selectedStage.windDirection);
    setTemperature(selectedStage.temperature);
    setElasticity(selectedStage.elasticity);
  }, [selectedStage]);

  // -- PHYSICS SANDBOX CANVAS SIMULATION STATES --
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stable refs for real-time game loops to prevent stale closure and avoid heavy React re-renders
  const playerPitchRef = useRef(15);
  const humidityRef = useRef(50);
  const windSpeedRef = useRef(4);
  const windDirectionRef = useRef("South-West");
  const temperatureRef = useRef(15);
  const elasticityRef = useRef(35);
  const weatherPresetRef = useRef<"normal" | "frozen" | "electrified" | "vaporize">("normal");
  const gamePlayModeRef = useRef<"visualizer" | "arcade">("visualizer");
  const gameActiveRef = useRef(false);

  // Keep them synced with React states immediately
  useEffect(() => { playerPitchRef.current = playerPitch; }, [playerPitch]);
  useEffect(() => { humidityRef.current = humidity; }, [humidity]);
  useEffect(() => { windSpeedRef.current = windSpeed; }, [windSpeed]);
  useEffect(() => { windDirectionRef.current = windDirection; }, [windDirection]);
  useEffect(() => { temperatureRef.current = temperature; }, [temperature]);
  useEffect(() => { elasticityRef.current = elasticity; }, [elasticity]);
  useEffect(() => { weatherPresetRef.current = weatherPreset; }, [weatherPreset]);
  useEffect(() => { gamePlayModeRef.current = gamePlayMode; }, [gamePlayMode]);
  useEffect(() => { gameActiveRef.current = gameActive; }, [gameActive]);

  // Track manual cursor deformation triggers on Canvas
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Sound triggers
  const toggleMute = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    synAndAmbiance.toggleMute();
    if (!nextMuted) {
      synAndAmbiance.playChime();
    }
  };

  const toggleBgm = () => {
    const nextBgm = !isBgmOn;
    setIsBgmOn(nextBgm);
    if (nextBgm) {
      synAndAmbiance.startBgm();
    } else {
      synAndAmbiance.stopBgm();
    }
  };

  // Reset sandbox to initial conditions
  const handleResetSandbox = (modeOption?: "visualizer" | "arcade") => {
    const targetMode = modeOption || gamePlayMode;
    setPlayerPos({ x: 100, y: 120 });
    setPlayerVel({ x: 2.8, y: 0.1 });
    setPlayerPitch(10);
    setWeatherPreset("normal");
    setDamageTexts([]);

    // Spawn and scale enemies according to the stage difficulty and layout
    const stageId = selectedStage.id;
    setEnemies([
      { id: 1, name: stageId === 5 ? "嵐芯・誘導ドローン" : "微風の偵察ドローン (Aero Sentinel)", x: 260, y: 140, vx: 0.7 * (1 + stageId * 0.1), vy: 0, state: "NORMAL", hp: 100, maxHp: 100, floatOffset: 0, damageCooldown: 0 },
      { id: 2, name: stageId === 5 ? "神鳴の電核 (Volt Matrix)" : "浮遊重力核 (Levitate Core)", x: 580, y: 100, vx: -0.5 * (1 + stageId * 0.1), vy: 0, state: "NORMAL", hp: 150, maxHp: 150, floatOffset: Math.PI / 3, damageCooldown: 0 },
      { id: 3, name: stageId === 5 ? "高天の雨喰神 (Siphon Core)" : "雨雲喰らい (Nimbus Siphon)", x: 420, y: 180, vx: -0.3 * (1 + stageId * 0.1), vy: 0, state: "NORMAL", hp: 120, maxHp: 120, floatOffset: Math.PI, damageCooldown: 0 }
    ]);

    if (targetMode === "arcade") {
      setArcadeScore(0);
      setArcadeCombo(1);
      setArcadeComboSec(0);
      setArcadeIntegrity(100);
      setArcadeTime(60);
      if (gameActive === false) {
        setGameActive(true);
      }
      setTimeout(() => {
        synAndAmbiance.playChime();
        if (isBgmOn) {
          synAndAmbiance.stopBgm();
          synAndAmbiance.startBgm();
        }
      }, 50);
    } else {
      setGameActive(false);
    }
  };

  // Switch element condition
  const handleElementSkillTrigger = (skillType: "pyro" | "cryo" | "electro") => {
    const textId = Date.now();
    let label = "PHASE TRANSITION!";
    let color = "#38bdf8";

    if (skillType === "pyro") {
      setWeatherPreset("vaporize");
      setTemperature(45);
      label = "THERMAL HYDRO-EVAPORATION (PYRO)";
      color = "#f43f5e";
      // Vaporize: enemies catch heat and float upward
      setEnemies(prev => prev.map(e => ({ ...e, state: "BURNED", vy: -2 })));
    } else if (skillType === "cryo") {
      setWeatherPreset("frozen");
      setTemperature(-22);
      label = "OVERCOOLED CYCLO-FREEZE (CRYO)";
      color = "#60a5fa";
      // Cryo: frozen solid and drop like rocks
      setEnemies(prev => prev.map(e => ({ ...e, state: "FROZEN", vy: 3, hp: Math.max(10, e.hp - 15) })));
    } else if (skillType === "electro") {
      setWeatherPreset("electrified");
      label = "STORM PLATINUM BATTERY (ELECTRO)";
      color = "#eab308";
      // Electro: stunned and paralyzed
      setEnemies(prev => prev.map(e => ({ ...e, state: "ELECTRIFIED", hp: Math.max(10, e.hp - 20) })));
    }

    setDamageTexts(prev => [
      ...prev,
      { id: textId, x: 280, y: 80, text: label, color, life: 75 }
    ]);
  };

  // Send variable inputs directly to Google Gemini models to enhance detailed document sections
  const handleGenerateSpec = async (sectionKey: string) => {
    setIsGenerating(true);
    setGeneratingError(null);

    const promptText = `
あなたは世界で最も成功した2Dゲームのリード物理プログラマー兼ゲームデザイナーです。
以下の「気象・流体・空中滑空アクション」のゲーム仕様項目「${sectionKey}」について、今回ユーザーが指定した最新の物理パラメータ値および特別要望を数理モデルも交えて極めてプロフェッショナルで高精細な仕様Markdown（日本語）として、拡張・再設計してください。

【現在のシミュレータパラメータ】
- 対象ステージ（天区）: ${selectedStage.name}
- 難易度: ${selectedStage.difficulty}
- 雲クラス: ${selectedStage.weatherType}
- 大気温度: ${temperature} °C
- 湿度レベル: ${humidity}%
- 基本風速: ${windSpeed} m/s
- 気流の方向: ${windDirection}
- 雲モデルのバネ初期弾力復帰率: ${elasticity}%
- 危険レベル: ${selectedStage.hazardLevel}

【ユーザーから届いた追加極秘要望指示】
「${customDirectives}」

【出力仕様・要件】
1. なぜこの湿度やパラメータから「そのフライト滑空挙動やバウンド挙動、敵NPCの吹っ飛び具合」が導かれるのか、空気力学（揚力と抗力の方程式）と流体力学の観点から納得できる詳細な数式モデルを記述すること。
2. 敵戦闘の「雲の跳ね返り衝撃」「過冷却氷結での質量増大」「帯電連鎖チェーン」についても数式、物理パラメーターを明記し、他のAIプログラマーが即座にC#やTypeScriptでゲームを構築可能な極めて詳細なドキュメントであること。
3. HTMLタグや余計な自己紹介・挨拶挨拶文は排除し、エンジニア向けのピュアなMarkdown構造だけで出力すること。
`;

    try {
      const response = await fetch(GEMINI_API_ROUTE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: promptText,
          systemInstruction: "You are the ultimate 2D lead game architect master. Output raw beautifully structured Markdown only."
        })
      });

      if (!response.ok) {
        throw new Error("Gemini AIサービスから応答がありませんでした（お手数ですがしばらく経ってから再度お試しください）。");
      }

      const data = await response.json();
      if (data && data.text) {
        setGeneratedSpecs((prev) => ({
          ...prev,
          [sectionKey === "ai-prompt" ? "ai-prompt" : sectionKey]: data.text
        }));

        setDamageTexts((prev) => [
          ...prev,
          { id: Date.now(), x: 400, y: 100, text: "Gemini Pro Specification updated successfully!", color: "#10b981", life: 80 }
        ]);
      } else {
        throw new Error("応答の解析に失敗しました。");
      }
    } catch (err: any) {
      setGeneratingError(err.message || "通信エラーが発生しました。");
    } finally {
      setIsGenerating(false);
    }
  };

  // Run Realtime interactive physical calculation inside canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;

    // High performance local refs to avoid react schedule stutters
    const posRef = { x: playerPos.x, y: playerPos.y };
    const velRef = { x: playerVel.x, y: playerVel.y };
    const pitchRef = { current: playerPitchRef.current };
    const integrityRef = { current: arcadeIntegrity };
    const scoreRef = { current: arcadeScore };
    const comboRef = { current: arcadeCombo };
    const comboTimerRef = { current: arcadeComboSec };
    const timerRef = { current: arcadeTime };

    // Track red flashing for player hits
    let playerFlashTimer = 0;

    // Bullet crescent weapon structure
    interface Bullet {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      age: number;
      maxAge: number;
      isEnemy: boolean;
      damage: number;
    }
    const bulletsList: Bullet[] = [];

    // Sparkles and Explosion Particles
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      age: number;
      maxAge: number;
    }
    const particlesList: Particle[] = [];

    // Collectibles: Glowing Time-extension Stars
    interface StarItem {
      x: number;
      y: number;
      pulse: number;
      collected: boolean;
    }
    const starsList: StarItem[] = [
      { x: 180, y: 80, pulse: 0, collected: false },
      { x: 400, y: 50, pulse: Math.PI / 3, collected: false },
      { x: 620, y: 70, pulse: Math.PI / 1.5, collected: false }
    ];

    // Local copy of enemies to mutate directly at 60Hz
    const localEnemies = enemies.map(e => ({ ...e }));

    // Local damage text array for zero-repaint fast performance rendering in canvas directly
    interface LocalDamageText {
      id: number;
      x: number;
      y: number;
      text: string;
      color: string;
      life: number;
    }
    const localDamageTexts: LocalDamageText[] = [];

    // Track keyboard triggers
    const keysPressed: { [key: string]: boolean } = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      // Space or C or Left click fires vacuum gales
      if (e.key === " " || e.key.toLowerCase() === "c") {
        e.preventDefault();
        fireGliderSlash();
      }
      keysPressed[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Initialize Cloud wave physics points (2D Viscoelastic Lattice)
    interface Point {
      x: number;
      y: number;
      origY: number;
      vx: number;
      vy: number;
    }
    const pts: Point[] = [];
    const count = 35;
    for (let i = 0; i < count; i++) {
      pts.push({
        x: (800 / (count - 1)) * i,
        y: 280 + Math.sin(i * 0.45) * 12,
        origY: 300 + Math.cos(i * 0.25) * 8,
        vx: 0,
        vy: 0
      });
    }

    let hoverTime = 0;
    let localWeather = weatherPresetRef.current;
    let textTimeCounter = 0;
    let lastUiUpdateTime = 0;

    // Set up active weapon firing hook
    const fireGliderSlash = () => {
      // Limit ammo timing
      const angle = Math.atan2(velRef.y, velRef.x);
      bulletsList.push({
        x: posRef.x + Math.cos(angle) * 22,
        y: posRef.y + Math.sin(angle) * 22,
        vx: Math.cos(angle) * 9.5,
        vy: Math.sin(angle) * 9.5,
        size: 16,
        age: 0,
        maxAge: 75,
        isEnemy: false,
        damage: 40
      });
      synAndAmbiance.playSlash();

      // Small air draft particles back
      for (let j = 0; j < 5; j++) {
        particlesList.push({
          x: posRef.x - Math.cos(angle) * 15,
          y: posRef.y - Math.sin(angle) * 15,
          vx: -Math.cos(angle) * (2 + Math.random() * 3) + (Math.random() - 0.5),
          vy: -Math.sin(angle) * (2 + Math.random() * 3) + (Math.random() - 0.5),
          size: 1.5 + Math.random() * 2,
          color: "rgba(186, 230, 253, 0.6)",
          alpha: 0.8,
          age: 0,
          maxAge: 15 + Math.random() * 10
        });
      }
    };

    // Track mouse triggers for slash on clicks inside canvas
    const handleCanvasClick = (e: MouseEvent) => {
      if (gamePlayMode === "arcade" && !gameActive) return;
      fireGliderSlash();
    };
    canvas.addEventListener("mousedown", handleCanvasClick);

    // Score and Combo award trigger
    const awardPoints = (ptsAwarded: number, detailLabel: string, color = "#10b981") => {
      const addedPoints = ptsAwarded * comboRef.current;
      scoreRef.current += addedPoints;
      // We will perform batched 100ms updates to React state inside gameLoop instead of instant, to prevent render choking

      // Increase Combo multiplier
      comboRef.current = Math.min(10, comboRef.current + 1);
      comboTimerRef.current = 4.5; // 4.5 seconds to do next action to preserve combo

      // Float info text inside canvas (performance-safe)
      localDamageTexts.push({
        id: Date.now() + Math.random(),
        x: posRef.x,
        y: posRef.y - 30,
        text: `🎯 ${detailLabel} +${addedPoints}! (${comboRef.current}x Combo)`,
        color,
        life: 55
      });
    };

    // Glider takes damage
    const damagePlayer = (dmg: number, reason: string) => {
      if (gamePlayModeRef.current === "visualizer") return; // sandbox is invulnerable!
      integrityRef.current = Math.max(0, integrityRef.current - dmg);
      playerFlashTimer = 18; // Flash red frames
      synAndAmbiance.playExplosion(false);

      // Float warning inside canvas (performance-safe)
      localDamageTexts.push({
        id: Date.now() + Math.random(),
        x: posRef.x,
        y: posRef.y - 12,
        text: `💥 SHIELD DAMAGE -${dmg}! (${reason})`,
        color: "#f43f5e",
        life: 60
      });

      // Respawning stars on high damage to help player
      if (Math.random() > 0.5) {
        starsList.forEach(s => {
          if (s.collected) {
            s.collected = false;
            s.x = 80 + Math.random() * 640;
            s.y = 40 + Math.random() * 100;
          }
        });
      }
    };

    // Game loop tick
    const gameLoop = () => {
      let currentSpeed = 0;
      let lift = 0;
      hoverTime += 0.012;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sync elements from active buttons cleanly via stable references
      localWeather = weatherPresetRef.current;

      const isArcade = gamePlayModeRef.current === "arcade";
      const isActive = gameActiveRef.current;

      // Handle Arcade timer deduction (approx 60 ticks per sec)
      if (isArcade && isActive) {
        textTimeCounter++;
        if (textTimeCounter >= 60) {
          textTimeCounter = 0;
          timerRef.current = Math.max(0, timerRef.current - 1);

          // If low on time, trigger chime warn sound
          if (timerRef.current < 10 && timerRef.current > 0) {
            synAndAmbiance.playSlash();
          }
        }

        // Combo decay
        if (comboTimerRef.current > 0) {
          comboTimerRef.current = Math.max(0, comboTimerRef.current - 1 / 60);
          if (comboTimerRef.current <= 0) {
            comboRef.current = 1;
          }
        }

        // Handle victory / defeat criteria
        if (integrityRef.current <= 0 || timerRef.current <= 0) {
          setGameActive(false);
          gameActiveRef.current = false;
          synAndAmbiance.playGameOver();
          synAndAmbiance.stopBgm();

          // Save high score
          try {
            const storedHighScore = Number(localStorage.getItem("AEROSCULPT_high_score") || "0");
            if (scoreRef.current > storedHighScore) {
              localStorage.setItem("AEROSCULPT_high_score", scoreRef.current.toString());
              setHighScore(scoreRef.current);
            }
          } catch (e) {
            console.error(e);
          }
        }
      }

      // Sync manual pitch controller drag when slider is changed
      if (Math.abs(pitchRef.current - playerPitchRef.current) > 0.5 && !keysPressed["arrowup"] && !keysPressed["w"] && !keysPressed["arrowdown"] && !keysPressed["s"]) {
        pitchRef.current = playerPitchRef.current;
      }

      // Handle keyboard steering
      // Pitch nose down (W / ArrowUp)
      if (keysPressed["arrowup"] || keysPressed["w"]) {
        pitchRef.current = Math.max(-45, pitchRef.current - 2.2);
      }
      // Pitch nose up (S / ArrowDown)
      if (keysPressed["arrowdown"] || keysPressed["s"]) {
        pitchRef.current = Math.min(65, pitchRef.current + 2.2);
      }
      // Bank drift left (A / ArrowLeft)
      if (keysPressed["arrowleft"] || keysPressed["a"]) {
        velRef.x = Math.max(-6, velRef.x - 0.22);
      }
      // Bank drift right (D / ArrowRight)
      if (keysPressed["arrowright"] || keysPressed["d"]) {
        velRef.x = Math.min(8, velRef.x + 0.22);
      }

      // 1. DRAW NEON SPACE DEEP ATMOSPHERE BACKGROUND
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle neon grid background representing airflow grid points
      ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Render sky high speed background wind vectors lines
      ctx.strokeStyle = "rgba(56, 189, 248, 0.12)";
      ctx.lineWidth = 1.2;
      const spacing = 65;
      for (let x = spacing / 2; x < canvas.width; x += spacing) {
        for (let y = 40; y < 240; y += spacing) {
          ctx.beginPath();
          ctx.moveTo(x, y);

          const windSway = Math.sin(hoverTime + x * 0.01) * 3;
          let dx = 12;
          let dy = 0;

          if (windDirectionRef.current.toLowerCase().includes("west")) {
            dx = -15; // blowing left
          } else if (windDirectionRef.current.toLowerCase().includes("updraft") || localWeather === "vaporize") {
            dx = windSway;
            dy = -15; // blowing upwards
          } else if (windDirectionRef.current.toLowerCase().includes("rotational")) {
            const cx = 400;
            const cy = 150;
            const angle = Math.atan2(y - cy, x - cx) + 0.45;
            dx = Math.cos(angle) * 14;
            dy = Math.sin(angle) * 14;
          }

          ctx.lineTo(x + dx, y + dy + windSway);
          ctx.stroke();

          // micro arrowheads
          ctx.fillStyle = "rgba(56, 189, 248, 0.22)";
          ctx.beginPath();
          ctx.arc(x + dx, y + dy + windSway, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. COMPUTE VISCOELASTIC SOFT-BODY CLOUD DEFORMATION
      const k = elasticityRef.current * 0.00045; // spring constant
      const damping = 0.93; // damping constant

      if (localWeather !== "frozen") {
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          const distToPlayer = Math.hypot(p.x - posRef.x, p.y - posRef.y);

          // Player deformation impact: slam the cloud downward
          if (distToPlayer < 75) {
            const pushForce = (75 - distToPlayer) * 0.48;
            p.vy += pushForce * (velRef.y > 0 ? 0.98 : 0.45);
            if (p.x < posRef.x) p.vx -= pushForce * 0.18;
            else p.vx += pushForce * 0.18;
          }

          // Mouse dragging deformation
          if (isDragging) {
            const distToMouse = Math.hypot(p.x - mousePos.x, p.y - mousePos.y);
            if (distToMouse < 95) {
              const mousePush = (95 - distToMouse) * 0.65;
              p.vy += mousePush * 0.55;
            }
          }

          // Left-Right neighbor smoothing connection (Viscoelastic mesh web propagation)
          if (i > 0) {
            const prev = pts[i - 1];
            const deltaY = prev.y - p.y;
            p.vy += deltaY * 0.095;
            prev.vy -= deltaY * 0.095;
          }
          if (i < pts.length - 1) {
            const next = pts[i + 1];
            const deltaY = next.y - p.y;
            p.vy += deltaY * 0.095;
            next.vy -= deltaY * 0.095;
          }

          // Elastic restoring force to baseline shape
          const forceY = -k * (p.y - p.origY);
          p.vy += forceY;
          p.vy *= damping;
          p.vx *= 0.88;

          p.y += p.vy;
          p.x += p.vx;

          // Keep boundary stability
          const defaultX = (800 / (pts.length - 1)) * i;
          p.x = p.x * 0.88 + defaultX * 0.12;
        }
      }

      // Draw viscoelastic cloud wave as a glowing continuous fluid-shape
      ctx.shadowBlur = 18;
      if (localWeather === "frozen") {
        ctx.shadowColor = "rgba(96, 165, 250, 0.6)";
        ctx.fillStyle = "rgba(191, 219, 254, 0.85)";
        ctx.strokeStyle = "rgba(96, 165, 250, 0.95)";
      } else if (localWeather === "electrified") {
         // Animating electric sparks shading color
        const yellowPulse = Math.sin(hoverTime * 20) * 0.2 + 0.65;
        ctx.shadowColor = `rgba(234, 179, 8, ${yellowPulse})`;
        ctx.fillStyle = `rgba(254, 240, 138, ${yellowPulse})`;
        ctx.strokeStyle = "rgba(234, 179, 8, 0.9)";
      } else if (localWeather === "vaporize") {
        ctx.shadowColor = "rgba(244, 63, 94, 0.3)";
        ctx.fillStyle = "rgba(254, 244, 245, 0.18)";
        ctx.strokeStyle = "rgba(244, 63, 94, 0.35)";
      } else {
        ctx.shadowColor = "rgba(255, 255, 255, 0.42)";
        ctx.fillStyle = "rgba(241, 245, 249, 0.84)";
        ctx.strokeStyle = "#ffffff";
      }

      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-10, canvas.height);
      ctx.lineTo(-10, pts[0].y);

      for (let i = 0; i < pts.length - 1; i++) {
        const xc = (pts[i].x + pts[i + 1].x) / 2;
        const yc = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.lineTo(canvas.width + 10, pts[pts.length - 1].y);
      ctx.lineTo(canvas.width + 10, canvas.height);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0; // reset shadow

      // Draw dynamic cloud puffs circles
      for (let i = 0; i < pts.length; i += 3) {
        const p = pts[i];
        ctx.beginPath();
        ctx.fillStyle = localWeather === "frozen"
          ? "rgba(191, 219, 254, 0.45)"
          : localWeather === "electrified"
            ? "rgba(253, 224, 71, 0.4)"
            : localWeather === "vaporize"
              ? "rgba(244, 63, 94, 0.08)"
              : "rgba(255, 255, 255, 0.38)";
        ctx.arc(p.x, p.y - 10, 16 + Math.abs(p.vy) * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      // Electro Lightning bolt spark effects
      if (localWeather === "electrified" && Math.random() > 0.45) {
        ctx.strokeStyle = "#fef08a";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        const randPt1 = pts[Math.floor(Math.random() * pts.length)];
        ctx.moveTo(randPt1.x, randPt1.y);
        ctx.lineTo(randPt1.x + (Math.random() - 0.5) * 50, randPt1.y - 40 - Math.random() * 40);
        ctx.lineTo(randPt1.x + (Math.random() - 0.5) * 30, randPt1.y - 80 - Math.random() * 40);
        ctx.stroke();
      }

      // Draw humidity drops
      if (humidityRef.current > 70) {
        ctx.fillStyle = localWeather === "frozen" ? "rgba(147, 197, 253, 0.4)" : "rgba(56, 189, 248, 0.45)";
        for (let r = 0; r < 7; r++) {
          const rx = Math.random() * canvas.width;
          const ry = Math.random() * canvas.height;
          ctx.fillRect(rx, ry, 1.2, 12);
        }
      }

      // 3. GLOWING GOLD STAR ITEMS REDISTRIBUTION
      starsList.forEach(star => {
        if (star.collected) return;
        star.pulse += 0.05;
        const bounceOffset = Math.sin(star.pulse) * 4;

        // Draw glowing golden star
        ctx.save();
        ctx.translate(star.x, star.y + bounceOffset);
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 15;
        ctx.fillStyle = "#fbbf24";
        
        ctx.beginPath();
        // Simple star shape draw
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * 9, -Math.sin((18 + i * 72) * Math.PI / 180) * 9);
          ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * 4, -Math.sin((54 + i * 72) * Math.PI / 180) * 4);
        }
        ctx.closePath();
        ctx.fill();

        // Draw circular rings around
        ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 14 + Math.sin(star.pulse * 1.5) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Detect player collision
        const distToPlayer = Math.hypot(star.x - posRef.x, star.y - posRef.y);
        if (distToPlayer < 24) {
          star.collected = true;
          // Award golden star!
          synAndAmbiance.playChime();
          awardPoints(400, "GOLD STAR ENERGY", "#fbbf24");
          integrityRef.current = Math.min(100, integrityRef.current + 18);
          setArcadeIntegrity(integrityRef.current);
          timerRef.current = Math.min(150, timerRef.current + 8);
          setArcadeTime(timerRef.current);

          // Explode shiny sparkles
          for (let s = 0; s < 18; s++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = 2 + Math.random() * 4;
            particlesList.push({
              x: star.x,
              y: star.y,
              vx: Math.cos(angle) * velocity,
              vy: Math.sin(angle) * velocity,
              size: 2.5 + Math.random() * 3,
              color: "#fbbf24",
              alpha: 1,
              age: 0,
              maxAge: 30 + Math.random() * 20
            });
          }
        }
      });

      // 4. FLOATING ENEMIES AI CALCULATION & DAMAGE GRAPHICS
      localEnemies.forEach((enemy) => {
        // Hover oscillations
        enemy.floatOffset += 0.024;
        const hoverY = Math.sin(enemy.floatOffset) * 0.45;

        // Path patrol bounds
        enemy.x += enemy.vx;
        enemy.y += enemy.vy + hoverY;

        if (enemy.x > canvas.width - 25 || enemy.x < 25) {
          enemy.vx *= -1;
        }

        // Apply slow decay to speed increments
        enemy.vy *= 0.96;
        enemy.vx = enemy.vx * 0.95 + (enemy.vx > 0 ? 0.05 : -0.05) * Math.abs(enemy.vx);

        if (enemy.damageCooldown > 0) enemy.damageCooldown--;

        // Implement elemental status changes on enemies
        if (enemy.state === "FROZEN") {
          enemy.vy += 0.42; // Fall heavy under gravity (Cryo Shatter weight)
          enemy.hp = Math.max(1, enemy.hp - 0.12); // subtle temperature decay damage
        } else if (enemy.state === "BURNED") {
          enemy.vy -= 0.22; // Drift upward with thermal heat draft
          enemy.hp = Math.max(1, enemy.hp - 0.22);
          if (enemy.y < 35) {
            enemy.y = 35;
            enemy.vy = 0;
          }
          if (Math.random() > 0.7) {
            // Embers rising from burned drone
            particlesList.push({
              x: enemy.x + (Math.random() - 0.5) * 20,
              y: enemy.y,
              vx: (Math.random() - 0.5) * 1,
              vy: -1.2 - Math.random() * 2,
              size: 1.5 + Math.random() * 2,
              color: "#f43f5e",
              alpha: 0.9,
              age: 0,
              maxAge: 20 + Math.random() * 15
            });
          }
        } else if (enemy.state === "ELECTRIFIED") {
          enemy.vx *= 0.35; // Paralyzed speed suppression
          enemy.vy = Math.sin(hoverTime * 18) * 1.6; // violently shiver
          enemy.hp = Math.max(1, enemy.hp - 0.45); // electroshock tick damage
          
          if (Math.random() > 0.8) {
            synAndAmbiance.playElectroShock();
            // Tiny bolts
            for (let j = 0; j < 3; j++) {
              particlesList.push({
                x: enemy.x,
                y: enemy.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: 1.8 + Math.random() * 2,
                color: "#fef08a",
                alpha: 1,
                age: 0,
                maxAge: 12 + Math.random() * 8
              });
            }
          }
        }

        // A. CLOUD TRAMPOLINE PRESS ATTACK TRIGGERING
        const eIdx = Math.min(pts.length - 1, Math.max(0, Math.floor((enemy.x / 800) * pts.length)));
        const cloudUnderY = pts[eIdx] ? pts[eIdx].y : canvas.height;
        const cloudUpwardVelocity = pts[eIdx] ? pts[eIdx].vy : 0;

        if (enemy.y > cloudUnderY - 32 && enemy.y < cloudUnderY + 12) {
          enemy.y = cloudUnderY - 32;
          if (cloudUpwardVelocity < -3.2) {
            // Elastic launch triggers trampolin strike!
            const damageVal = Math.round(Math.abs(cloudUpwardVelocity) * 7.5);
            enemy.vy = -Math.abs(cloudUpwardVelocity) * 1.35;
            enemy.hp = Math.max(0, enemy.hp - damageVal);

            synAndAmbiance.playBounce();
            awardPoints(120, "TRAMPOLINE LAUNCH", "#10b981");

            // Blue energy circle shockwave
            for (let j = 0; j < 22; j++) {
              const a = Math.random() * Math.PI * 2;
              const spd = 3 + Math.random() * 6;
              particlesList.push({
                x: enemy.x,
                y: enemy.y + 10,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd - 1,
                size: 2.2 + Math.random() * 3,
                color: "#14b8a6",
                alpha: 1,
                age: 0,
                maxAge: 25 + Math.random() * 15
              });
            }
          }
        }

        // B. SOLID FREEZING CRASH SHATTER DESTRUCTION
        if (enemy.state === "FROZEN" && enemy.y > cloudUnderY - 24) {
          enemy.y = cloudUnderY - 24;
          enemy.hp = 0; // instantly shattered!
          synAndAmbiance.playIceShatter();
          awardPoints(250, "❄️ CRYO SHATTER! ❄️", "#60a5fa");

          // Big burst of crystalline blue ice particles
          for (let j = 0; j < 32; j++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 2 + Math.random() * 7;
            particlesList.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              size: 2.5 + Math.random() * 4,
              color: "rgba(191, 219, 254, 0.95)",
              alpha: 1,
              age: 0,
              maxAge: 35 + Math.random() * 25
            });
          }
        }

        // C. REDIRECT FIRES SPARK TO DODGE FOR ARCADE MODE
        if (gamePlayMode === "arcade" && gameActive && enemy.hp > 0 && enemy.damageCooldown === 0) {
          // Slow reload frequency depending on difficulty selected
          const reloadPeriod = selectedStage.id === 5 ? 120 : 200 - selectedStage.id * 15;
          if (Math.random() < 1.0 / reloadPeriod) {
            enemy.damageCooldown = 60; // wait 1s

            // Aim target vector to player
            const dx = posRef.x - enemy.x;
            const dy = posRef.y - enemy.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 450) {
              const bSpeed = 3.5 + selectedStage.id * 0.4;
              bulletsList.push({
                x: enemy.x,
                y: enemy.y + 10,
                vx: (dx / dist) * bSpeed,
                vy: (dy / dist) * bSpeed,
                size: 7,
                age: 0,
                maxAge: 160,
                isEnemy: true,
                damage: 15
              });

              // Sparks indicator
              for (let s = 0; s < 4; s++) {
                particlesList.push({
                  x: enemy.x,
                  y: enemy.y,
                  vx: (Math.random() - 0.5) * 3,
                  vy: (Math.random() - 0.5) * 3 + 1,
                  size: 2,
                  color: "#e11d48",
                  alpha: 0.9,
                  age: 0,
                  maxAge: 14
                });
              }
            }
          }
        }

        // D. RESPAWN MECHANISM WITH HIGH POINTS BONUS
        if (enemy.hp <= 0) {
          enemy.hp = enemy.maxHp;
          enemy.x = Math.random() * 600 + 100;
          enemy.y = 50 + Math.random() * 80;
          enemy.vy = 0;
          enemy.state = "NORMAL";

          awardPoints(150, `DESOLATED ${enemy.name}!`, "#fb7185");
          synAndAmbiance.playExplosion(true);

          // Big fiery explosion particles
          for (let p = 0; p < 25; p++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 1.5 + Math.random() * 6;
            particlesList.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(a) * spd,
              vy: Math.sin(a) * spd,
              size: 3 + Math.random() * 5,
              color: Math.random() > 0.5 ? "#f43f5e" : "#fb923c",
              alpha: 1,
              age: 0,
              maxAge: 40 + Math.random() * 20
            });
          }
        }

        // E. DRAW ENEMY DRONE TARGET UNIT
        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        // Electrified ring feedback outline
        if (enemy.state === "ELECTRIFIED") {
          ctx.strokeStyle = "rgba(253, 224, 71, 0.85)";
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(0, 0, 24 + Math.sin(hoverTime * 15) * 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Main outer mechanical disk pod
        ctx.fillStyle = enemy.state === "FROZEN"
          ? "rgba(191, 219, 254, 0.9)"
          : enemy.state === "BURNED"
            ? "rgba(254, 205, 211, 0.95)"
            : enemy.state === "ELECTRIFIED"
              ? "rgba(254, 240, 138, 0.9)"
              : "#1e293b";

        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Mechanical inner core iris
        ctx.fillStyle = enemy.state === "NORMAL" ? "#f43f5e" : "#0ea5e9";
        ctx.beginPath();
        ctx.arc(0, Math.sin(hoverTime * 5) * 1.5, 6, 0, Math.PI * 2);
        ctx.fill();

        // Left/Right motor drone rotors wings
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(-14, 0); ctx.lineTo(-24, -3 + Math.sin(hoverTime * 25) * 2);
        ctx.moveTo(14, 0); ctx.lineTo(24, -3 + Math.sin(hoverTime * 25) * 2);
        ctx.stroke();

        // Draw mechanical drone propeller spinning caps
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(-27, -5 + Math.sin(hoverTime * 25) * 2, 6, 1.5);
        ctx.fillRect(21, -5 + Math.sin(hoverTime * 25) * 2, 6, 1.5);

        // FLOATING HP SLIDER
        const barW = 34;
        const barH = 4.5;
        ctx.fillStyle = "#0c0a09";
        ctx.fillRect(-barW / 2, -26, barW, barH);

        const hpRatio = enemy.hp / enemy.maxHp;
        ctx.fillStyle = hpRatio > 0.5 ? "#10b981" : hpRatio > 0.2 ? "#f59e0b" : "#ef4444";
        ctx.fillRect(-barW / 2, -26, barW * hpRatio, barH);

        // Text label tag
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 8.5px monospace";
        ctx.fillText(enemy.name, -barW, -32);

        ctx.restore();
      });

      // 5. UPDATE GLIDER / PLAYER FLIGHT PHYSICS SIMULATION
      const closestPtIdx = Math.min(pts.length - 1, Math.max(0, Math.floor((posRef.x / 800) * pts.length)));
      const cloudSurfaceY = pts[closestPtIdx] ? pts[closestPtIdx].y : canvas.height;
      const distToSurface = cloudSurfaceY - posRef.y;

      // Identify lift glider modes
      let localState: "GLIDING" | "SURFING" | "STALL" | "BOOST" = "GLIDING";
      if (localWeather === "vaporize") {
        localState = "BOOST";
      } else if (distToSurface < 20 && distToSurface > -15) {
        localState = "SURFING";

        // Surfing refills Shield Integrity!
        if (gamePlayModeRef.current === "arcade" && integrityRef.current < 100) {
          integrityRef.current = Math.min(100, integrityRef.current + 0.12);
        }
      } else if (pitchRef.current > 54) {
        localState = "STALL";
      }

      // Aerodynamic force equations direct execution
      const radPitch = (pitchRef.current * Math.PI) / 180;
      const targetVel = {
        x: Math.cos(radPitch) * 5.2 + (windSpeedRef.current * 0.14),
        y: Math.sin(radPitch) * 5.6 + 0.8
      };

      const speedFac = localState === "SURFING"
        ? 0.12
        : localState === "BOOST"
          ? 0.28
          : 0.08;

      let newVx = velRef.x * (1 - speedFac) + targetVel.x * speedFac;
      let newVy = velRef.y * (1 - speedFac) + targetVel.y * speedFac;

      // Handle lateral wind push drift
      if (windDirectionRef.current.toLowerCase().includes("west")) {
        newVx -= windSpeedRef.current * 0.038;
      } else if (windDirectionRef.current.toLowerCase().includes("east") || windDirectionRef.current.toLowerCase().includes("south-west")) {
        newVx += windSpeedRef.current * 0.038;
      }

      // Air vertical draft lifts
      if (windDirectionRef.current.toLowerCase().includes("updraft") || localState === "BOOST") {
        newVy -= windSpeedRef.current * 0.16;
      } else {
        newVy += 0.22; // Passive gravitational drift drag
      }

      posRef.x += newVx;
      posRef.y += newVy;

      // Loop glider coordinates left/right borders
      if (posRef.x > canvas.width) posRef.x = 0;
      if (posRef.x < 0) posRef.x = canvas.width;

      // Boundary crash controls
      if (posRef.y < 20) {
        posRef.y = 20;
        newVy = 0.5;
      }
      if (posRef.y > cloudSurfaceY - 4) {
        // High impact trampolin deformation bounce back
        posRef.y = cloudSurfaceY - 4;
        newVy = -0.7; // bounce back gravity
        
        // Trampolin recoil SFX
        synAndAmbiance.playBounce();
      }

      velRef.x = newVx;
      velRef.y = newVy;

      // Sync stats inside loop scope variable (will be flushed to state via 100ms throttle timer at loop end)
      currentSpeed = Math.round(Math.hypot(newVx, newVy) * 8.2);
      lift = Math.round(Math.max(0, (Math.cos(radPitch) * currentSpeed * (humidityRef.current * 0.015))));

      // Update sound modulation dynamically
      synAndAmbiance.updateGliderSound(currentSpeed, localState === "STALL");

      // 6. UPDATE AND DRAW CRAFT PROJECTILES (bullets)
      for (let bIndex = bulletsList.length - 1; bIndex >= 0; bIndex--) {
        const b = bulletsList[bIndex];
        b.x += b.vx;
        b.y += b.vy;
        b.age++;

        // Draw projectile
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.atan2(b.vy, b.vx));

        if (b.isEnemy) {
          // Enemy reddish sparks orb
          ctx.strokeStyle = "#fda4af";
          ctx.shadowColor = "#f43f5e";
          ctx.shadowBlur = 10;
          ctx.fillStyle = "#e11d48";
          ctx.beginPath();
          ctx.arc(0, 0, b.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Flying vacuum crescent gale blade
          ctx.strokeStyle = "rgba(56, 189, 248, 0.95)";
          ctx.shadowColor = "#0ea5e9";
          ctx.shadowBlur = 15;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(0, 0, b.size, -Math.PI / 3, Math.PI / 3);
          ctx.stroke();
        }
        ctx.restore();

        // Projectile collisions resolving
        if (b.isEnemy) {
          // Check player collide hit
          const dToPlayer = Math.hypot(b.x - posRef.x, b.y - posRef.y);
          if (dToPlayer < 18) {
            damagePlayer(b.damage, "Sentinel Projectile");
            bulletsList.splice(bIndex, 1);
            continue;
          }
        } else {
          // Check weapon hits enemy units
          for (let eIdx = 0; eIdx < localEnemies.length; eIdx++) {
            const enemy = localEnemies[eIdx];
            const dToEnemy = Math.hypot(b.x - enemy.x, b.y - enemy.y);
            if (dToEnemy < 24) {
              const baseDmg = b.damage;
              // Cryo shatter bonus 3.5x
              const finalDmg = enemy.state === "ELECTRIFIED" ? Math.round(baseDmg * 2.2) : baseDmg;
              enemy.hp = Math.max(0, enemy.hp - finalDmg);

              // Push the enemy with weapon impact velocity
              enemy.vx += b.vx * 0.18;
              enemy.vy += b.vy * 0.15;

              synAndAmbiance.playExplosion(false);
              awardPoints(finalDmg, `GALE STRIKE`, "#38bdf8");

              // Spawn sparkle hits
              for (let h = 0; h < 6; h++) {
                particlesList.push({
                  x: b.x,
                  y: b.y,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 5,
                  size: 2,
                  color: "#38bdf8",
                  alpha: 0.9,
                  age: 0,
                  maxAge: 15
                });
              }

              // Remove bullet
              bulletsList.splice(bIndex, 1);
              break;
            }
          }
        }

        // Drop if out of screen bounds or aged
        if (b.age > b.maxAge || b.x < -20 || b.x > canvas.width + 20 || b.y < -20 || b.y > canvas.height + 20) {
          bulletsList.splice(bIndex, 1);
        }
      }

      // 7. COMPUTE DIRECT GLIDER IMPACT TO ENEMIES
      localEnemies.forEach((enemy) => {
        const dToEnemy = Math.hypot(posRef.x - enemy.x, posRef.y - enemy.y);
        if (dToEnemy < 22) {
          // Charge Strike damage based on dynamic gliding speed energy
          const hitDamage = Math.round(currentSpeed * 0.98);
          enemy.hp = Math.max(0, enemy.hp - hitDamage);
          enemy.vy += velRef.y * 1.5 - 1; // launch enemy upwards
          enemy.vx += velRef.x * 0.7;

          // Bounce craft backward
          velRef.y = -Math.abs(velRef.y) * 0.5 - 0.5;
          posRef.y -= 5;

          synAndAmbiance.playExplosion(false);
          awardPoints(hitDamage + 40, "GLIDER CHARGE STRIKE", "#e11d48");

          // Red glitter star bursts
          for (let s = 0; s < 12; s++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = 2 + Math.random() * 5;
            particlesList.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(angle) * velocity,
              vy: Math.sin(angle) * velocity,
              size: 2.5 + Math.random() * 2.5,
              color: "#fb7185",
              alpha: 0.9,
              age: 0,
              maxAge: 25 + Math.random() * 12
            });
          }
        }
      });

      // 8. UPDATE AND DRAW PARTICLES
      for (let pIndex = particlesList.length - 1; pIndex >= 0; pIndex--) {
        const p = particlesList[pIndex];
        p.x += p.vx;
        p.y += p.vy;
        p.age++;
        p.alpha = 1.0 - (p.age / p.maxAge);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.age > p.maxAge) {
          particlesList.splice(pIndex, 1);
        }
      }

      // 9. DRAW GLIDER COCKPIT CRAFT
      ctx.save();
      ctx.translate(posRef.x, posRef.y);
      ctx.rotate(Math.atan2(newVy, newVx));

      // Red flashing if player is damaged
      if (playerFlashTimer > 0) {
        playerFlashTimer--;
        ctx.fillStyle = `rgba(239, 68, 68, ${playerFlashTimer % 2 === 0 ? 0.95 : 0.4})`;
      } else {
        ctx.fillStyle = localState === "SURFING"
          ? "#38bdf8"
          : localState === "BOOST"
            ? "#f43f5e"
            : localState === "STALL"
              ? "#ef4444"
              : "#a78bfa";
      }

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.6;

      // Draw aerodynamic wings
      ctx.beginPath();
      ctx.moveTo(-16, -5);
      ctx.lineTo(10, 0);
      ctx.lineTo(-16, 5);
      ctx.lineTo(-11, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Exhaust trailing trail particles behind wings
      if (localState === "BOOST") {
        ctx.beginPath();
        ctx.fillStyle = "rgba(244, 63, 94, 0.9)";
        ctx.arc(-18, 0, 5 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.fillStyle = "rgba(167, 139, 250, 0.75)";
        ctx.arc(-14, 0, 3 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // 10. DRAW FLOAT COMBAT INDICATORS FEED OVERLAYS (Performance optimal local direct rendering)
      for (let idx = localDamageTexts.length - 1; idx >= 0; idx--) {
        const t = localDamageTexts[idx];
        t.life--;
        if (t.life <= 0) {
          localDamageTexts.splice(idx, 1);
        } else {
          ctx.save();
          ctx.fillStyle = t.color;
          ctx.font = "bold 13px monospace";
          ctx.shadowColor = t.color;
          ctx.shadowBlur = 5;
          ctx.fillText(t.text, t.x - 30, t.y - (55 - t.life) * 0.65);
          ctx.restore();
        }
      }

      // 10.5. DRAW DETAILED HUD ON CANVAS GENERATED GRAPHICS (Zero React Performance Cost)
      ctx.save();
      
      // Check mode
      if (isArcade) {
        // --- ARCADE MODE HUD ---
        // Score Panel Box
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(16, 16, 150, 52, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 9px monospace";
        ctx.fillText("SCORE", 26, 32);

        ctx.fillStyle = "#f43f5e";
        ctx.font = "900 18px monospace";
        ctx.shadowColor = "#f43f5e";
        ctx.shadowBlur = 4;
        ctx.fillText(scoreRef.current.toString().padStart(6, "0"), 26, 52);
        ctx.shadowBlur = 0;

        // Combo Panel Box
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
        ctx.beginPath();
        ctx.roundRect(174, 16, 130, 52, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 9px monospace";
        ctx.fillText("COMBO MULTIPLIER", 184, 32);

        ctx.fillStyle = "#fbbf24";
        ctx.font = "900 16px monospace";
        ctx.fillText(`${comboRef.current.toFixed(1)}x`, 184, 48);

        // Combo bar decay
        if (comboRef.current > 1) {
          ctx.fillStyle = "rgba(30, 41, 59, 0.9)";
          ctx.fillRect(184, 52, 110, 4);
          ctx.fillStyle = "#fbbf24";
          ctx.fillRect(184, 52, 110 * (comboTimerRef.current / 4.5), 4);
        }

        // Shield Mesh Status (Right side)
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.strokeStyle = "rgba(52, 211, 153, 0.4)";
        ctx.beginPath();
        ctx.roundRect(470, 16, 190, 52, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 9px monospace";
        ctx.fillText("🛡️ SHIELD INTEGRITY", 480, 31);

        const integrityVal = Math.floor(integrityRef.current);
        ctx.fillStyle = integrityVal > 50 ? "#10b981" : integrityVal > 25 ? "#f59e0b" : "#ef4444";
        ctx.font = "bold 12px monospace";
        ctx.fillText(`${integrityVal}%`, 615, 31);

        // Shield Bar
        ctx.fillStyle = "rgba(30, 41, 59, 0.9)";
        ctx.fillRect(480, 38, 170, 8);
        const shieldRatio = Math.max(0, Math.min(1, integrityRef.current / 100));
        ctx.fillStyle = integrityVal > 50 ? "#10b981" : integrityVal > 25 ? "#f59e0b" : "#ef4444";
        ctx.fillRect(480, 38, 170 * shieldRatio, 8);

        // Countdown Timer
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.strokeStyle = timerRef.current < 15 ? "rgba(239, 68, 68, 0.6)" : "rgba(56, 189, 248, 0.4)";
        ctx.beginPath();
        ctx.roundRect(676, 16, 108, 52, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 8px monospace";
        ctx.fillText("🕒 COUNTDOWN", 686, 30);

        const isTimePinch = timerRef.current < 15;
        ctx.fillStyle = isTimePinch ? (Math.floor(Date.now() / 250) % 2 === 0 ? "#ef4444" : "#fca5a5") : "#38bdf8";
        ctx.font = "900 21px monospace";
        ctx.fillText(`${timerRef.current}s`, 686, 52);
      } else {
        // --- VISUALIZER FREE SANDBOX HUD ---
        ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
        ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
        ctx.beginPath();
        ctx.roundRect(16, 16, 210, 36, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#38bdf8";
        ctx.arc(28, 34, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 11px monospace";
        ctx.fillText("FREE FLIGHT SANDBOX", 38, 38);
      }

      // --- BOTTOM LEFT TELEMETRY HUB PANEL ---
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
      ctx.beginPath();
      // Panel positioned nicely at the bottom
      ctx.roundRect(16, 290, 220, 94, 8);
      ctx.fill();
      ctx.stroke();

      // Lab
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 9px monospace";
      ctx.fillText("⚡ FLIGHT TELEMETRY V2", 26, 306);

      // State label
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px monospace";
      ctx.fillText("FLIGHT STATE  :", 26, 326);
      ctx.font = "bold 10px monospace";
      if (localState === "SURFING") {
        ctx.fillStyle = "#38bdf8";
      } else if (localState === "BOOST") {
        ctx.fillStyle = "#f43f5e";
      } else if (localState === "STALL") {
        ctx.fillStyle = "#ef4444";
      } else {
        ctx.fillStyle = "#10b981";
      }
      ctx.fillText(localState, 126, 326);

      // Speed
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px monospace";
      ctx.fillText("GLIDE SPEED   :", 26, 344);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 10px monospace";
      ctx.fillText(`${currentSpeed} Knots`, 126, 344);

      // Lift
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px monospace";
      ctx.fillText("DYNAMIC LIFT  :", 26, 362);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 10px monospace";
      ctx.fillText(`${lift} N`, 126, 362);

      // Altitude
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px monospace";
      ctx.fillText("CLOUD HEIGHT  :", 26, 380);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 10px monospace";
      ctx.fillText(`${Math.max(0, Math.floor(distToSurface))} m`, 126, 380);


      // --- BOTTOM RIGHT MANUAL FLIGHT CONTROLS ---
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
      ctx.beginPath();
      ctx.roundRect(554, 298, 230, 86, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#a78bfa";
      ctx.font = "bold 9px monospace";
      ctx.fillText("🎮 FLIGHT MANUAL CONTROLLERS", 564, 314);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "10px monospace";
      ctx.fillText("STEER PITCH  : [W] / [S] or [↑] / [↓]", 564, 332);
      ctx.fillText("WIND DRIFT   : [A] / [D] or [←] / [→]", 564, 348);
      ctx.fillText("GALE ATTACK  : [SPACE] or [C] KEY", 564, 364);
      
      const isShockReady = bulletsList.filter(b => !b.isEnemy).length === 0;
      ctx.fillStyle = isShockReady ? "#34d399" : "#64748b";
      ctx.font = "bold 8.5px monospace";
      ctx.fillText(isShockReady ? "● VACUUM GALE ATTACK READY (SPACE)" : "○ RELOADING AIR CHARGE...", 564, 376);

      ctx.restore();


      // 11. BATCHED PERFORMANCE THROTTLE: Synchronize progress back to React states gently (every 500ms instead of 100ms)
      // This solves heavy render choke completely!
      const nowMs = performance.now();
      if (nowMs - lastUiUpdateTime > 500) {
        lastUiUpdateTime = nowMs;

        // Sync essential telemetry value only
        setPlayerState(localState);
        setSpeedVal(currentSpeed);
        setLiftPower(lift);
        setPlayerPitch(Math.round(pitchRef.current));
        
        // Match player positions so overlay effects or retry handlers don't crash
        setPlayerPos({ x: posRef.x, y: posRef.y });
        
        if (isArcade) {
          setArcadeScore(scoreRef.current);
          setArcadeCombo(comboRef.current);
          setArcadeComboSec(comboTimerRef.current);
          setArcadeIntegrity(Math.floor(integrityRef.current));
          setArcadeTime(timerRef.current);
        }
      }

      animFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("mousedown", handleCanvasClick);
    };
  }, [
    selectedStage,
    currentTab,
    gamePlayMode
  ]);

  // Handle downloading specification file
  const handleDownloadSpecs = () => {
    const fullSpecText = `# AEROSCULPT - 2D Cloud Physics Action Game Target Specification
作成日: 2026-06-17

---

## ■ 基本パラメータ構成 & 気象シミュレーション
- ターゲット区: ${selectedStage.name}
- 難易度格付: ${selectedStage.difficulty}
- 基本雲気象タイプ: ${selectedStage.weatherType}
- シミュレーション設定値:
  - 湿度: ${humidity}%
  - 風速: ${windSpeed} m/s (${windDirection})
  - 環境温: ${temperature} °C
  - 雲の初期復帰弾性力 (Elasticity): ${elasticity}/100
  - 危険レベル: ${selectedStage.hazardLevel}

---

${generatedSpecs.physics}

---

${generatedSpecs.movement}

---

${generatedSpecs.gimmick}

---

${generatedSpecs.combat}

---

${generatedSpecs.prompt || generatedSpecs["ai-prompt"]}
`;

    const blob = new Blob([fullSpecText], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `AEROSCULPT_game_spec_${selectedStage.id}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy helper for text content
  const handleCopyText = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(title);
    setTimeout(() => {
      setCopiedSection(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-sky-500 selection:text-slate-950">
      
      {/* GLOWING HEADER BAR */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4" id="header_spec_nav">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 opacity-75 blur-md animate-pulse"></div>
            <div className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-sky-400">
              <Cloud className="h-6 w-6 animate-float" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tracking-widest text-sky-400 font-bold bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/40">TECH SYSTEM: AEROSCULPT</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight text-white">
              雲の３Dアクションゲーム プレミアム極秘仕様書ビルダー
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleCopyText(JSON.stringify(selectedStage, null, 2), "meta")}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg transition-all"
            title="現在のステージの物理パラメータJSONをコピー"
          >
            {copiedSection === "meta" ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>JSONメタ copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>物理パラメータJSONコピー</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadSpecs}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-sky-400 to-indigo-400 rounded-lg shadow-lg shadow-sky-950/50 hover:brightness-110 active:scale-95 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>全結合仕様書 一括DL (.md)</span>
          </button>
        </div>
      </header>

      {/* STAGE & ENVIRONMENT SELECTOR OVERVIEW */}
      <section className="bg-slate-900/40 border-b border-slate-800/80 p-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Stage selection info */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center gap-2 text-sky-400 text-xs font-mono font-bold tracking-wider">
            <Layers className="h-4 w-4" />
            <span>STAGES DEFINITION CONFIG</span>
          </div>
          <h2 className="text-lg md:text-xl font-bold font-display text-slate-100">
            テスト検証：対象ステージ（天区）を選択
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            選択すると、難易度・湿度・極限状態の気流ベクトルがリアルタイム Sandbox シミュレーターおよび AI生成設計書の構成変数に即座に同期・適用されます。
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-1 gap-2 pt-1">
            {PRESET_STAGES.map((stg) => (
              <button
                key={stg.id}
                onClick={() => setSelectedStage(stg)}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all group ${
                  selectedStage.id === stg.id
                    ? "bg-slate-900 text-sky-400 border-sky-500/80 shadow-md shadow-sky-950"
                    : "bg-slate-900/40 text-slate-400 border-slate-800/60 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className={`text-[10px] font-mono font-bold py-0.5 px-2 rounded-sm ${
                    stg.difficulty === "Beginner" ? "bg-emerald-950 text-emerald-400 border border-emerald-800/30" :
                    stg.difficulty === "Medium" ? "bg-cyan-950 text-cyan-400 border border-cyan-800/30" :
                    stg.difficulty === "Hard" ? "bg-amber-950 text-amber-400 border border-amber-800/30" :
                    stg.difficulty === "Expert" ? "bg-rose-950 text-rose-400 border border-rose-800/30" :
                    "bg-fuchsia-950 text-fuchsia-400 border border-fuchsia-800/30"
                  }`}>
                    {stg.difficulty}
                  </span>
                  <span className="text-xs font-medium font-mono truncate">{stg.name}</span>
                </div>
                <ChevronRight className={`h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity ${
                  selectedStage.id === stg.id ? "text-sky-400 opacity-100" : ""
                }`} />
              </button>
            ))}
          </div>
        </div>

        {/* Selected stage overview card item */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl p-5 lg:p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 bg-gradient-to-bl from-slate-800/40 text-slate-500 text-xs font-mono">
            STAGE METADATA_0{selectedStage.id}
          </div>

          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping"></span>
            <h3 className="text-base md:text-lg font-bold text-white font-mono flex items-center gap-2">
              {selectedStage.name}
            </h3>
          </div>

          <p className="mt-3 text-xs md:text-sm text-slate-300 leading-relaxed font-sans border-l-2 border-sky-500 pl-3">
            {selectedStage.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-800/60 font-mono text-xs">
            <div>
              <span className="text-slate-500 block mb-1">雲の種別</span>
              <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                <Cloud className="h-3.5 w-3.5 text-sky-400" />
                {selectedStage.weatherType}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">風圧方向</span>
              <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                <Wind className="h-3.5 w-3.5 text-sky-400" />
                {selectedStage.windDirection}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">危険レベル</span>
              <span className={`font-semibold ${
                selectedStage.hazardLevel === "Extreme" ? "text-rose-400" : 
                selectedStage.hazardLevel === "High" ? "text-amber-400" : "text-sky-300"
              }`}>
                {selectedStage.hazardLevel}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">中核パズルギミック</span>
              <span className="text-slate-300 text-[10px] sm:text-xs leading-none">
                {selectedStage.gimmickIdea}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN TWO-COLUMN SPLIT CONTAINER */}
      <main className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 p-6 md:p-8">
        
        {/* LEFT COLUMN: INTERACTIVE TUNING PANELS (4 Cols) */}
        <section className="xl:col-span-4 space-y-6 flex flex-col">
          
          {/* SANDBOX CONTROLLER PARAMETERS */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4.5 w-4.5 text-sky-400" />
                <h4 className="font-semibold text-sm text-slate-200 font-display">
                  環境・物理シミュレーション変数調整
                </h4>
              </div>
              <HelpCircle className="h-4 w-4 text-slate-500" title="これらを調整すると物理シミュレーターが即座に適応し、Geminiでの仕様書生成の数値にも組込まれます。" />
            </div>

            {/* Parameter adjusters */}
            <div className="space-y-4 text-xs">
              
              {/* HUMIDITY Slider */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">大気湿度 (Humidity)</span>
                  <span className="text-sky-400 font-mono font-bold">{humidity}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={humidity}
                  onChange={(e) => setHumidity(Number(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">
                  湿度が高いと空気密度が上昇し、飛行時の滑空揚力および雲サーフィン時の摩擦耐性が向上。
                </p>
              </div>

              {/* WIND SPEED Slider */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">基本風速 (Wind Velocity)</span>
                  <span className="text-sky-400 font-mono font-bold">{windSpeed} m/s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="45"
                  value={windSpeed}
                  onChange={(e) => setWindSpeed(Number(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">
                  風速を上げると、気流ベクトルの影響が強まり、風上への移動時に失速(STALL)の危険が拡大。
                </p>
              </div>

              {/* ELASTICITY Slider */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">雲のバネ弾性復帰力 (Viscoelasticity)</span>
                  <span className="text-sky-400 font-mono font-bold">{elasticity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={elasticity}
                  onChange={(e) => setElasticity(Number(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">
                  雲を押し潰したあとの元の形への戻る早さ。高いほどトランポリンのようによく弾みます。
                </p>
              </div>

              {/* TEMPERATURE Slider */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">環境温度 (Atmosphere Temp)</span>
                  <span className={`font-mono font-bold ${temperature < 0 ? "text-blue-400" : "text-amber-400"}`}>
                    {temperature} °C
                  </span>
                </div>
                <input
                  type="range"
                  min="-40"
                  max="60"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">
                  0度以下では雲が自動的に「氷晶化（ソリッド）」し、摩擦が皆無に。40度以上では滞留が極めて不安定になります。
                </p>
              </div>

              {/* Wind direction descriptor dropdown selector */}
              <div className="space-y-1 pt-1">
                <span className="text-slate-400 font-medium block">風流方向 (Wind Vector Heading)</span>
                <select
                  value={windDirection}
                  onChange={(e) => setWindDirection(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded p-1.5 font-mono text-xs focus:ring-1 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="South-West">South-West (南西から吹き込む順風)</option>
                  <option value="West">West (強い直滑降を促す偏西風)</option>
                  <option value="Updraft (Ascending)">Updraft (高度上昇をアシストする上昇気流)</option>
                  <option value="North-West">North-West (極小の摩擦をまとう高気圧・北西風)</option>
                  <option value="Rotational (Cyclone)">Rotational (不安定な渦を巻くサイクロン気流)</option>
                </select>
              </div>
            </div>
          </div>

          {/* CUSTOM DIRECTIVES WRITING AREA */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3 flex-1 flex flex-col">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Sparkles className="h-4.5 w-4.5 text-sky-400" />
              <h4 className="font-semibold text-sm text-slate-100 font-display">
                プロンプトへ追加するカスタム要望指示書
              </h4>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              他のAIにより詳細に組み込ませたいゲーム仕様（例: Verlet、Metaball、衝突破壊力学など）や特別要望を記述してください。仕様書自動生成時にプロダウンへ混入します。
            </p>

            <textarea
              className="w-full flex-1 min-h-[120px] bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none placeholder-slate-600 leading-normal"
              placeholder="ここに物理エンジンへの独自の要望を追加記述します。例：'雲を切り裂く瞬間、周りの気液力学を表現するためのパーリンノイズに基づくスプラッシュパーティクルを発生させる。' など..."
              value={customDirectives}
              onChange={(e) => setCustomDirectives(e.target.value)}
            />

            <div className="bg-sky-950/40 border border-sky-800/40 rounded-lg p-2.5 text-[10px] text-sky-300 leading-normal flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <span>上の要望を加味して、右カラムの「詳細仕様を動的生成」を押すと、Google Gemini AIが数秒で高精細な仕様Markdownを最適アップデートします。</span>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: SANDBOX PREVIEW & DYNAMIC DOCUMENT GENERATOR (8 Cols) */}
        <section className="xl:col-span-8 flex flex-col gap-6">
          
          {/* NAVIGATION TABS FOR SANDBOX vs GENERATED TECHNICAL DOCUMENTS */}
          <div className="flex border-b border-slate-800 flex-wrap">
            <button
              onClick={() => {
                setCurrentTab("sandbox");
                handleResetSandbox();
              }}
              className={`px-5 py-3 text-xs md:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                currentTab === "sandbox"
                  ? "border-sky-500 text-sky-400 bg-slate-900/30"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10"
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>【体験検証】リアルタイム雲物理・敵戦闘シミュレーター (Visual Sandbox)</span>
            </button>
            <button
              onClick={() => setCurrentTab("docs")}
              className={`px-5 py-3 text-xs md:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                currentTab === "docs"
                  ? "border-sky-500 text-sky-400 bg-slate-900/30"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>【仕様ドキュメント】AI開発専用 設計プロンプト / 設計書</span>
            </button>
          </div>

          {/* TAB CONTENT 1: SANDBOX PREVIEW (PLAYABLE FIGHTING COMBAT STAGE) */}
          {currentTab === "sandbox" && (
            <div className="space-y-4">
              
              {/* INTERACTIVE GAMEPLAY MODE SELECTOR & AUDIO CONTROLLER */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500"></div>
                
                {/* Mode Select */}
                <div className="md:col-span-6 space-y-1">
                  <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block">PLAY MODE CONTROLLER</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setGamePlayMode("visualizer");
                        handleResetSandbox("visualizer");
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                        gamePlayMode === "visualizer"
                          ? "bg-slate-950 text-sky-400 border-sky-500/60 shadow-inner"
                          : "bg-slate-900 text-slate-400 border-slate-800/80 hover:text-slate-200"
                      }`}
                    >
                      <Activity className="h-4 w-4" />
                      <span>癒し系物理モデル検証 (Sandbox)</span>
                    </button>
                    <button
                      onClick={() => {
                        setGamePlayMode("arcade");
                        handleResetSandbox("arcade");
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                        gamePlayMode === "arcade"
                          ? "bg-slate-950 text-rose-400 border-rose-500/60 shadow-inner"
                          : "bg-slate-900 text-slate-400 border-slate-800/80 hover:text-slate-200"
                      }`}
                    >
                      <Trophy className="h-4 w-4" />
                      <span>天空タイムアタック (Arcade)</span>
                    </button>
                  </div>
                </div>

                {/* Sound Synthesis Controls */}
                <div className="md:col-span-6 space-y-1">
                  <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block">INTEGRATED WEB AUDIO MIDI SYNTHESIZER</span>
                  <div className="flex gap-2">
                    <button
                      onClick={toggleMute}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                        !isAudioMuted
                          ? "bg-indigo-950 text-indigo-300 border-indigo-700/60"
                          : "bg-slate-900 text-slate-400 border-slate-800/60"
                      }`}
                      title="音響効果音のオン/オフを設定（ブラウザポリシー尊重）"
                    >
                      {!isAudioMuted ? <Volume2 className="h-4 w-4 text-sky-400" /> : <VolumeX className="h-4 w-4" />}
                      <span>音響効果音 SFX: {!isAudioMuted ? "ON (有効)" : "MUTE (消音)"}</span>
                    </button>
                    <button
                      onClick={toggleBgm}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                        isBgmOn
                          ? "bg-purple-950 text-purple-300 border-purple-700/60"
                          : "bg-slate-900 text-slate-400 border-slate-800/60"
                      }`}
                      title="心地よいレトロ大気・浮遊アンビエントMIDI音源の再生"
                    >
                      <Sparkles className="h-4 w-4 text-purple-400" />
                      <span>浮遊流体 BGM: {isBgmOn ? "PLAYING" : "OFF"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic instruction box info */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-slate-200 font-mono tracking-wider flex items-center gap-1.5 uppercase">
                    <Compass className="h-4 w-4 text-sky-400 shrink-0" />
                    2D天空物理・高反発衝突・天候変化エレメント戦闘システム
                  </h5>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    マウスのドラッグで<strong>雲をダイナミックに押して変形</strong>できます。急降下し、厚い「雲レイヤー」を強く跳ね上げて、浮遊する<strong>「敵ドローン」を天空高くブッ飛ばして破壊（HP 0でリスポーン）</strong>しましょう！
                  </p>
                </div>

                {/* Manual Preset Skills triggers */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleElementSkillTrigger("pyro")}
                    className="px-2.5 py-1.5 text-[10px] font-bold bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-md transition-all flex items-center gap-1"
                    title="高熱 of 気流を放ち、雲を気化。敵を燃焼により上昇させます。"
                  >
                    <Flame className="h-3 w-3" />
                    <span>炎熱蒸発 (Pyro)</span>
                  </button>
                  <button
                    onClick={() => handleElementSkillTrigger("cryo")}
                    className="px-2.5 py-1.5 text-[10px] font-bold bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800/60 rounded-md transition-all flex items-center gap-1"
                    title="雲を過冷却凍結させ、変形しない氷のソリッドに。敵は氷結して落下・破砕します。"
                  >
                    <Snowflake className="h-3 w-3" />
                    <span>極寒凍結 (Cryo)</span>
                  </button>
                  <button
                    onClick={() => handleElementSkillTrigger("electro")}
                    className="px-2.5 py-1.5 text-[10px] font-bold bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800/60 rounded-md transition-all flex items-center gap-1"
                    title="雲に電気エネルギーを蓄電し、敵をショックスタンさせて行動麻痺ダメージを与えます。"
                  >
                    <Zap className="h-3 w-3" />
                    <span>落雷帯電 (Electro)</span>
                  </button>
                  <button
                    onClick={() => handleResetSandbox()}
                    className="p-1.5 text-slate-400 bg-slate-800 hover:text-white hover:bg-slate-700 rounded-md transition-all"
                    title="物理シミュレータ敵構成を初期リセット"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* CANVAS SANDBOX STAGE GRAPHICS */}
              <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-inner">
                
                {/* ARCADE MODE ACTIVE HUD OVERLAY */}
                {gamePlayMode === "arcade" && (
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
                    {/* Left stats: Score, Combo */}
                    <div className="flex gap-2 font-mono">
                      <div className="bg-slate-950/90 border border-slate-800/80 px-4 py-2.5 rounded-lg flex flex-col justify-center min-w-[120px] backdrop-blur-md">
                        <span className="text-[9px] text-slate-500 font-bold tracking-wider">SCORE</span>
                        <span className="text-lg font-black text-rose-500 text-shadow-glow">
                          {arcadeScore.toString().padStart(6, "0")}
                        </span>
                      </div>
                      
                      <div className="bg-slate-950/90 border border-slate-800/80 px-4 py-2.5 rounded-lg flex flex-col justify-center min-w-[100px] backdrop-blur-md">
                        <span className="text-[9px] text-slate-500 font-bold tracking-wider">COMBO x{arcadeCombo}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-sm font-extrabold text-amber-400">
                            {arcadeCombo > 1 ? `${arcadeCombo}x MULTI` : "1.0x"}
                          </span>
                          {arcadeCombo > 1 && (
                            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden w-12 shrink-0">
                              <div
                                className="h-full bg-amber-400 transition-all duration-100"
                                style={{ width: `${(arcadeComboSec / 4.5) * 100}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Golden High score trophy */}
                    <div className="hidden sm:flex items-center gap-2 bg-slate-950/90 border border-amber-900/40 px-3 py-1 bg-amber-950/10 rounded-full backdrop-blur-md font-mono text-[10px]">
                      <Trophy className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                      <span className="text-[9px] font-mono text-amber-300 font-bold tracking-wider uppercase">
                        HI-SCORE: {highScore.toString().padStart(6, "0")}
                      </span>
                    </div>

                    {/* Right Stats: Shield, Timer */}
                    <div className="flex gap-2 font-mono text-xs">
                      {/* Shield integrity */}
                      <div className="bg-slate-950/90 border border-slate-800/80 px-4 py-2.5 rounded-lg flex flex-col justify-center min-w-[130px] backdrop-blur-md">
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold tracking-wider">
                          <span>🛡️ SHIELD MESH</span>
                          <span className={arcadeIntegrity > 30 ? "text-emerald-400" : "text-rose-500 animate-pulse"}>
                            {arcadeIntegrity}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded transition-all duration-300 ${
                              arcadeIntegrity > 50 ? "bg-emerald-500" : arcadeIntegrity > 25 ? "bg-amber-400" : "bg-rose-500"
                            }`}
                            style={{ width: `${arcadeIntegrity}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Countdown timer */}
                      <div className={`bg-slate-950/90 border px-4 py-2 rounded-lg flex flex-col justify-center items-center min-w-[80px] backdrop-blur-md ${
                        arcadeTime < 15 ? "border-rose-700/85 animate-pulse bg-rose-950/40" : "border-slate-800/80"
                      }`}>
                        <span className="text-[8px] text-slate-400 font-bold tracking-wider flex items-center gap-1 select-none">
                          <Timer className="h-2.5 w-2.5" /> COUNTDOWN
                        </span>
                        <span className={`text-xl font-bold font-mono ${
                          arcadeTime < 15 ? "text-rose-400" : "text-sky-300"
                        }`}>
                          {arcadeTime}s
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* VISUALIZER MODE ACTIVE OVERLAYS */}
                {gamePlayMode === "visualizer" && (
                  <div className="absolute top-4 left-4 p-3 bg-slate-950/85 backdrop-blur-md rounded-lg border border-slate-800/80 space-y-2 font-mono text-[10px] z-10 w-52 pointer-events-none select-none">
                    <div className="flex items-center gap-1.5 text-sky-400 border-b border-slate-900 pb-1.5 mb-1.5 font-bold uppercase tracking-wider">
                      <Activity className="h-3.5 w-3.5" />
                      <span>FLIGHT & COMBAT TELEMETRY</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">飛行状態 (State):</span>
                      <span className={`font-bold ${
                        playerState === "SURFING" ? "text-sky-400" :
                        playerState === "BOOST" ? "text-rose-400 animate-pulse" :
                        playerState === "STALL" ? "text-red-500 animate-bounce" : "text-emerald-400"
                      }`}>
                        {playerState}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">滑空速度 (Speed):</span>
                      <span className="text-slate-200 font-bold">{speedVal} Knots</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">動的揚力 (Lift force):</span>
                      <span className="text-slate-200 font-bold">{liftPower} N</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">気圧係数 (Air Dens):</span>
                      <span className="text-slate-200 font-bold">{(1.2 * (humidity / 50)).toFixed(2)} kg/m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">気象状態 (Element):</span>
                      <span className={`font-bold capitalize ${
                        weatherPreset === "frozen" ? "text-blue-400" :
                        weatherPreset === "electrified" ? "text-yellow-400" :
                        weatherPreset === "vaporize" ? "text-rose-400" : "text-slate-400"
                      }`}>
                        {weatherPreset === "normal" ? "Normal (常温)" : weatherPreset}
                      </span>
                    </div>
                  </div>
                )}

                {/* GAME OVER RETRY IN-CANVAS MODAL SCREEN */}
                {gamePlayMode === "arcade" && !gameActive && (
                  <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center p-6 text-center select-none backdrop-blur-md">
                    <div className="max-w-md space-y-5 p-6 bg-slate-900 border border-rose-950/60 rounded-2xl shadow-2xl relative">
                      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-rose-500 to-indigo-600 opacity-20 blur-lg"></div>
                      
                      <div className="relative space-y-2">
                        <Trophy className="h-12 w-12 text-rose-500 mx-auto animate-bounce" />
                        <h2 className="text-2xl font-black tracking-widest text-white uppercase text-shadow-glow">
                          MISSION CONCLUDED
                        </h2>
                        <p className="text-xs text-slate-400 font-mono">
                          難易度：{selectedStage.name} / {selectedStage.difficulty}
                        </p>
                      </div>

                      <div className="relative grid grid-cols-2 gap-4 bg-slate-950/80 p-4 border border-slate-800 rounded-xl font-mono">
                        <div className="text-left">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">FINAL SCORE</span>
                          <span className="text-xl font-black text-rose-400">{arcadeScore} pts</span>
                        </div>
                        <div className="text-left border-l border-slate-800 pl-4">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">PERSONAL RECORD</span>
                          <span className="text-xl font-black text-amber-400">{highScore} pts</span>
                        </div>
                      </div>

                      <div className="relative space-y-1 bg-slate-950/40 p-3 rounded-lg text-slate-400 text-xs leading-relaxed text-left font-mono">
                        <div className="flex gap-2 items-start">
                          <span className="text-sky-400">💡</span>
                          <span>雲と滑空飛行の組み合わせによって物理ダメージが最大化されます。<b>氷結(Cryo)させ、重さで雲にぶつけて粉砕</b>させるなど、相転移コンボを駆使しましょう！</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleResetSandbox("arcade")}
                        className="relative w-full py-3 bg-gradient-to-r from-rose-500 to-purple-600 hover:brightness-110 active:scale-98 text-slate-950 font-black tracking-widest text-sm rounded-xl shadow-lg transition-all"
                      >
                        天空タイムアタック 挑戦開始!
                      </button>
                    </div>
                  </div>
                )}

                {/* Pitch controller input range as vertical slider overlay on the right */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-950/85 backdrop-blur-md p-3 rounded-lg border border-slate-800/80 flex flex-col items-center gap-2 z-10">
                  <span className="text-[9px] font-mono font-bold text-sky-400 transform -rotate-90 origin-center my-6">GLIDE_PITCH</span>
                  <input
                    type="range"
                    min="-45"
                    max="65"
                    value={playerPitch}
                    onChange={(e) => setPlayerPitch(Number(e.target.value))}
                    className="h-28 accent-sky-400 cursor-pointer"
                    style={{ writingMode: "bt-lr", WebkitAppearance: "slider-vertical" } as any}
                  />
                  <span className="text-xs font-mono font-bold text-slate-200 mt-1">{playerPitch}°</span>
                </div>

                {/* THE ACTUAL PHYSICAL CANVAS */}
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={400}
                  className="w-full h-[400px] cursor-crosshair block"
                  onMouseMove={(e) => {
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (rect) {
                      setMousePos({
                        x: ((e.clientX - rect.left) / rect.width) * 800,
                        y: ((e.clientY - rect.top) / rect.height) * 400
                      });
                    }
                  }}
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseLeave={() => setIsDragging(false)}
                />

                {/* Custom watermark / telemetry status indicators inside canvas */}
                <div className="absolute bottom-4 left-4 flex gap-4 text-[9px] text-slate-500 font-mono tracking-widest pointer-events-none select-none">
                  <span>SCALE: 1px = 3.5cm</span>
                  <span>SIMS RATE: 60Hz TICKS</span>
                  <span>COMBAT DETECTION: ACTIVE</span>
                  {gamePlayMode === "arcade" && <span className="text-rose-400 animate-pulse font-bold">🔴 ARCADE GAMEPLAY ACTIVE</span>}
                </div>
              </div>

              {/* Keyboard Action Control Legends */}
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded shadow">W</span>
                  <span className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded shadow">S</span>
                  <span className="text-xs text-slate-400">/</span>
                  <span className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded shadow">↑</span>
                  <span className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded shadow">↓</span>
                  <span className="text-xs text-slate-300 font-bold">ピッチ傾斜旋回</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded shadow font-bold">A</span>
                  <span className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded shadow font-bold">D</span>
                  <span className="text-xs text-slate-400">/</span>
                  <span className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded shadow font-bold">←</span>
                  <span className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded shadow font-bold">→</span>
                  <span className="text-xs text-slate-300 font-bold">機体バンク左右ドリフト</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-5 py-1 bg-slate-950 border border-slate-800 text-sky-400 text-xs rounded shadow font-black">SPACE</span>
                  <span className="text-xs text-slate-300 font-bold">真空衝撃衝動破刃!</span>
                </div>
              </div>

              {/* Explanatory tips card on interactions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/40 border border-slate-800/60 p-3 rounded-lg space-y-1">
                  <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5 font-mono">
                    <Sword className="h-3.5 w-3.5 text-rose-400" />
                    雲の押し上げ & 衝突突き上げ撃退
                  </span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    滑空をマイナス角（急降下）に倒して雲にダイナミック衝突。雲を押し沈めたあと勢いよく元の形に弾き返す力で、真上に浮遊する敵をフッ飛ばせます！
                  </p>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/60 p-3 rounded-lg space-y-1">
                  <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5 font-mono">
                    <Flame className="h-3.5 w-3.5 text-orange-400" />
                    相転移コンボ（氷結墜落破砕）
                  </span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    敵は「氷結（Cryo）」状態になると氷漬けになって地上へ急速落下。落ちた先の地面、氷結雲に激突した瞬間に衝撃で粉々に砕け散ります！
                  </p>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/60 p-3 rounded-lg space-y-1">
                  <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5 font-mono">
                    <Zap className="h-3.5 w-3.5 text-yellow-400" />
                    落雷帯電・感電スタン (Chains)
                  </span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    「帯電（Electro）」させると、敵ドローンはスパークに包まれながら行動麻痺。一定時間震えながら激しい落雷継続ダメージを受け続けます。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT 2: SPECIFICATION DOCUMENT COPIER BOX */}
          {currentTab === "docs" && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-2xl flex-1 flex flex-col space-y-4">
              
              {/* SPEC SECTION TABS SELECTOR */}
              <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
                <button
                  onClick={() => setActiveDocSubTab("physics")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all ${
                    activeDocSubTab === "physics"
                      ? "bg-sky-500 text-slate-950 shadow-md font-bold"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  <Cpu className="h-3.5 w-3.5" />
                  <span>【1】物理演算・雲変形構造</span>
                </button>
                <button
                  onClick={() => setActiveDocSubTab("movement")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all ${
                    activeDocSubTab === "movement"
                      ? "bg-sky-500 text-slate-950 shadow-md font-bold"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>【2】空中滑空・移動力学</span>
                </button>
                <button
                  onClick={() => setActiveDocSubTab("gimmick")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all ${
                    activeDocSubTab === "gimmick"
                      ? "bg-sky-500 text-slate-950 shadow-md font-bold"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>【3】天候マトリクス・ギミック</span>
                </button>
                <button
                  onClick={() => setActiveDocSubTab("combat")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all ${
                    activeDocSubTab === "combat"
                      ? "bg-sky-500 text-slate-950 shadow-md font-bold"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  <Sword className="h-3.5 w-3.5" />
                  <span>【4】物理敵戦闘・エレメント討伐仕様</span>
                </button>
                <button
                  onClick={() => setActiveDocSubTab("prompt")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all ${
                    activeDocSubTab === "prompt"
                      ? "bg-sky-500 text-slate-950 shadow-md font-bold"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>【5】他AI専用完璧プロンプト</span>
                </button>
              </div>

              {/* SPEC DOC CONTROLS (GENERATE VIA GEMINI BUTTON!) */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800/50 px-2.5 py-0.5 rounded-full inline-block">
                    GEMINI PRO MODEL ACTIVE
                  </span>
                  <p className="text-xs text-slate-300">
                    現在の「{selectedStage.name}」の環境パラメータとカスタム指示要望に基づいて、このセクションの設計書をGeminiでダイナミックに再生成・拡張できます。
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGenerateSpec(activeDocSubTab === "prompt" ? "ai-prompt" : activeDocSubTab)}
                    disabled={isGenerating}
                    className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 rounded-lg shadow transition-all active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <div className="h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                        <span>ドキュメント拡張生成中...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-slate-950" />
                        <span>AIで高精細に個別再生成</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleCopyText(generatedSpecs[activeDocSubTab === "prompt" ? "ai-prompt" : activeDocSubTab], activeDocSubTab)}
                    className="p-2.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 hover:border-slate-700 text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer"
                    title="このセクションの極秘仕様ドキュメント(Markdown)をコピーします"
                  >
                    {copiedSection === activeDocSubTab ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error messages if generation fails */}
              {generatingError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{generatingError}</span>
                </div>
              )}

              {/* LIVE MARKDOWN SPECS OUTPUT CONTAINER */}
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-6 font-mono text-xs overflow-y-auto leading-relaxed max-h-[480px]">
                <div className="text-slate-300 whitespace-pre-wrap select-text markdown-render-custom">
                  {generatedSpecs[activeDocSubTab === "prompt" ? "ai-prompt" : activeDocSubTab]}
                </div>
              </div>

              {/* Explanatory notice to prompt use */}
              <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 flex items-start gap-3">
                <Cpu className="h-5 w-5 text-sky-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h6 className="text-[11px] font-bold text-slate-200">
                    他のAI（ChatGPT, Claude 3.5 Sonnet, Cursor 等）へ連携する最適解：
                  </h6>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    「他AI専用完璧プロンプト」タブには、このシミュレータの物理演算をベースとしたゲーム実装コードを直接作成させるためのシステム命令文がパッケージング化されています。コピーして開発を進めましょう。
                  </p>
                </div>
              </div>

            </div>
          )}
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-6 text-center text-xs text-slate-500 font-mono flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <span>AEROSCULPT SYSTEM • THE LEAD GAME ARCHITECT SUITE</span>
        </div>
        <div>
          <span>Crafted for high-fidelity 2D atmospheric physical simulations</span>
        </div>
      </footer>

    </div>
  );
}
