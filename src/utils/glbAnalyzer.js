import * as THREE from 'three'

/**
 * Analyze a GLB model's geometry to compute:
 * - Volume (for mass estimation)
 * - Center of Gravity (geometric centroid)
 * - Attachment Point (vertex above CoG closest to vertical line through CoG)
 */

/**
 * Calculate the signed volume of a tetrahedron formed by a triangle and the origin
 * Used for computing total mesh volume via the divergence theorem
 */
function signedVolumeOfTriangle(p1, p2, p3) {
  return p1.dot(p2.clone().cross(p3)) / 6.0
}

/**
 * Calculate the area of a triangle
 */
function triangleArea(p1, p2, p3) {
  const ab = p2.clone().sub(p1)
  const ac = p3.clone().sub(p1)
  return ab.cross(ac).length() / 2.0
}

/**
 * Calculate the centroid of a triangle
 */
function triangleCentroid(p1, p2, p3) {
  return new THREE.Vector3(
    (p1.x + p2.x + p3.x) / 3,
    (p1.y + p2.y + p3.y) / 3,
    (p1.z + p2.z + p3.z) / 3
  )
}

/**
 * Extract all triangles from a BufferGeometry
 */
function extractTriangles(geometry) {
  const triangles = []
  const position = geometry.getAttribute('position')
  const index = geometry.getIndex()
  
  if (index) {
    // Indexed geometry
    for (let i = 0; i < index.count; i += 3) {
      const a = index.getX(i)
      const b = index.getX(i + 1)
      const c = index.getX(i + 2)
      
      triangles.push({
        p1: new THREE.Vector3().fromBufferAttribute(position, a),
        p2: new THREE.Vector3().fromBufferAttribute(position, b),
        p3: new THREE.Vector3().fromBufferAttribute(position, c)
      })
    }
  } else {
    // Non-indexed geometry
    for (let i = 0; i < position.count; i += 3) {
      triangles.push({
        p1: new THREE.Vector3().fromBufferAttribute(position, i),
        p2: new THREE.Vector3().fromBufferAttribute(position, i + 1),
        p3: new THREE.Vector3().fromBufferAttribute(position, i + 2)
      })
    }
  }
  
  return triangles
}

/**
 * Extract all vertices from a BufferGeometry
 */
function extractVertices(geometry) {
  const vertices = []
  const position = geometry.getAttribute('position')
  
  for (let i = 0; i < position.count; i++) {
    vertices.push(new THREE.Vector3().fromBufferAttribute(position, i))
  }
  
  return vertices
}

/**
 * Compute the total volume of a mesh using signed tetrahedra method
 */
function computeVolume(triangles) {
  let volume = 0
  
  for (const { p1, p2, p3 } of triangles) {
    volume += signedVolumeOfTriangle(p1, p2, p3)
  }
  
  return Math.abs(volume)
}

/**
 * Compute the center of gravity as area-weighted centroid
 */
function computeCenterOfGravity(triangles) {
  let totalArea = 0
  const weightedSum = new THREE.Vector3(0, 0, 0)
  
  for (const { p1, p2, p3 } of triangles) {
    const area = triangleArea(p1, p2, p3)
    const centroid = triangleCentroid(p1, p2, p3)
    
    weightedSum.add(centroid.multiplyScalar(area))
    totalArea += area
  }
  
  if (totalArea === 0) {
    return new THREE.Vector3(0, 0, 0)
  }
  
  return weightedSum.divideScalar(totalArea)
}

/**
 * Find the attachment point: vertex above CoG with minimal horizontal distance to CoG
 */
function computeAttachmentPoint(vertices, centerOfGravity) {
  let bestVertex = null
  let minHorizontalDistance = Infinity
  
  // Filter vertices above the center of gravity
  const verticesAboveCoG = vertices.filter(v => v.y > centerOfGravity.y)
  
  if (verticesAboveCoG.length === 0) {
    // Fallback: find the highest vertex
    let highestVertex = vertices[0]
    for (const v of vertices) {
      if (v.y > highestVertex.y) {
        highestVertex = v
      }
    }
    return highestVertex.clone()
  }
  
  // Find vertex with minimal horizontal distance to CoG
  for (const vertex of verticesAboveCoG) {
    const horizontalDistance = Math.sqrt(
      Math.pow(vertex.x - centerOfGravity.x, 2) +
      Math.pow(vertex.z - centerOfGravity.z, 2)
    )
    
    if (horizontalDistance < minHorizontalDistance) {
      minHorizontalDistance = horizontalDistance
      bestVertex = vertex
    }
  }
  
  return bestVertex.clone()
}

/**
 * Analyze all meshes in a GLTF scene and return combined analysis
 * Note: Returns unscaled values - caller should apply scale as needed
 */
export function analyzeGLTFScene(scene) {
  const allTriangles = []
  const allVertices = []
  
  // Traverse the scene and collect all mesh geometries
  scene.traverse((child) => {
    if (child.isMesh && child.geometry) {
      // Clone and apply world transform to geometry
      const geometry = child.geometry.clone()
      geometry.applyMatrix4(child.matrixWorld)
      
      const triangles = extractTriangles(geometry)
      const vertices = extractVertices(geometry)
      
      allTriangles.push(...triangles)
      allVertices.push(...vertices)
    }
  })
  
  if (allTriangles.length === 0) {
    console.warn('No mesh geometry found in GLTF scene')
    return {
      volume: 0,
      centerOfGravity: new THREE.Vector3(0, 0, 0),
      attachmentPoint: new THREE.Vector3(0, 0, 0),
      boundingBox: new THREE.Box3()
    }
  }
  
  // Compute bounding box
  const boundingBox = new THREE.Box3()
  for (const vertex of allVertices) {
    boundingBox.expandByPoint(vertex)
  }
  
  // Compute analysis values
  const volume = computeVolume(allTriangles)
  const centerOfGravity = computeCenterOfGravity(allTriangles)
  const attachmentPoint = computeAttachmentPoint(allVertices, centerOfGravity)
  
  return {
    volume,
    centerOfGravity,
    attachmentPoint,
    boundingBox
  }
}

/**
 * Estimate mass from volume
 * Assumes a default density (similar to wood/plastic)
 * Returns mass in the same unit system as the app (1 mass unit = 50g)
 */
export function estimateMassFromVolume(volume, density = 1.0) {
  // Volume is in scene units cubed
  // 1 scene unit = 10cm = 0.1m
  // So 1 scene unit³ = 0.001 m³ = 1000 cm³
  
  // Assume density of ~0.8 g/cm³ (like light wood/plastic)
  const volumeInCm3 = volume * 1000
  const massInGrams = volumeInCm3 * 0.8 * density
  
  // Convert to app mass units (1 unit = 50g)
  const massUnits = massInGrams / 50
  
  // Clamp to reasonable range (0.1 to 10 mass units = 5g to 500g)
  return Math.max(0.1, Math.min(10, massUnits))
}

/**
 * Compute the offset needed to position the model so the attachment point is at origin
 */
export function computeAttachmentOffset(attachmentPoint) {
  return new THREE.Vector3(
    -attachmentPoint.x,
    -attachmentPoint.y,
    -attachmentPoint.z
  )
}

