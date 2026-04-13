import { Box3, Group, Object3D, Vector3 } from 'three'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import bossShipUrl from '../../../../resources/assets/ships/enemy/boss/glb/optimized/intergalactic_spaceship_only_model.optimized.glb?url'
import commonEnemyShipUrl from '../../../../resources/assets/ships/enemy/common/glb/optimized/stylised_spaceship.optimized.glb?url'
import playerShipUrl from '../../../../resources/assets/ships/player/glb/optimized/wipeout_spaceship.optimized.glb?url'

export type ShipAssetId = 'player-wipeout' | 'enemy-stylised' | 'boss-intergalactic'

interface ShipAssetDefinition {
  id: ShipAssetId
  label: string
  slot: 'player' | 'enemy-common' | 'boss'
  url: string
  targetSize: number
  rotation?: {
    x?: number
    y?: number
    z?: number
  }
  offset?: {
    x?: number
    y?: number
    z?: number
  }
}

const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder)
const sceneCache = new Map<string, Promise<Group | null>>()
const bounds = new Box3()
const sizeVector = new Vector3()
const centerVector = new Vector3()

export const selectedShipAssets: Record<ShipAssetId, ShipAssetDefinition> = {
  'player-wipeout': {
    id: 'player-wipeout',
    label: 'Wipeout Spaceship',
    slot: 'player',
    url: playerShipUrl,
    targetSize: 3.4,
    rotation: { x: 0, y: 0, z: 0 },
    offset: { x: 0, y: -0.08, z: 0.1 },
  },
  'enemy-stylised': {
    id: 'enemy-stylised',
    label: 'Stylised Spaceship',
    slot: 'enemy-common',
    url: commonEnemyShipUrl,
    targetSize: 2.5,
    rotation: { x: 0, y: Math.PI, z: 0 },
    offset: { x: 0, y: 0.08, z: 0 },
  },
  'boss-intergalactic': {
    id: 'boss-intergalactic',
    label: 'Intergalactic Spaceship',
    slot: 'boss',
    url: bossShipUrl,
    targetSize: 8.6,
    rotation: { x: 0, y: Math.PI, z: 0 },
    offset: { x: 0, y: -0.22, z: 0.55 },
  },
}

export const shipReuseNotes = {
  player: [
    'wipeout_spaceship.glb',
    'death_row_spaceship.glb',
    'futuristic_spaceship.glb',
    'light_fighter_spaceship_-_free_-.glb',
    'spaceship_-_cb1.glb',
  ],
  enemyCommon: [
    'namek_spaceship.glb',
    'spaceships.glb',
    'stylised_spaceship.glb',
  ],
  boss: ['intergalactic_spaceship_only_model.glb'],
} as const

export async function loadShipModel(assetId: ShipAssetId): Promise<Group | null> {
  const asset = selectedShipAssets[assetId]
  const cached = sceneCache.get(assetId)

  if (cached) {
    return cloneTemplate(await cached)
  }

  const next = loader
    .loadAsync(asset.url)
    .then((gltf) => normalizeScene(gltf.scene, asset))
    .catch((error: unknown) => {
      console.warn(`Failed to load ship asset: ${asset.label}`, error)
      return null
    })

  sceneCache.set(assetId, next)
  return cloneTemplate(await next)
}

function cloneTemplate(template: Group | null): Group | null {
  return template ? template.clone(true) : null
}

function normalizeScene(source: Object3D, asset: ShipAssetDefinition): Group {
  const template = new Group()
  const root = source.clone(true)

  root.traverse((node) => {
    node.castShadow = true
    node.receiveShadow = true
  })

  template.add(root)

  bounds.setFromObject(root)
  if (!bounds.isEmpty()) {
    bounds.getSize(sizeVector)
    bounds.getCenter(centerVector)

    const maxDimension = Math.max(sizeVector.x, sizeVector.y, sizeVector.z) || 1
    const scale = asset.targetSize / maxDimension

    root.scale.setScalar(scale)
    bounds.setFromObject(root)
    bounds.getCenter(centerVector)

    root.position.sub(centerVector)
  }

  template.rotation.set(asset.rotation?.x ?? 0, asset.rotation?.y ?? 0, asset.rotation?.z ?? 0)
  template.position.set(asset.offset?.x ?? 0, asset.offset?.y ?? 0, asset.offset?.z ?? 0)
  template.updateMatrixWorld(true)

  return template
}
