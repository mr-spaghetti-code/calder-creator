import React, { useEffect } from 'react'
import useMobileStore from '../store/mobileStore'
import EmptyPanel from './EmptyPanel'
import WeightPanel from './WeightPanel'
import ArmPanel from './ArmPanel'

export default function Panel() {
  const selectedNode = useMobileStore((state) => state.getSelectedNode())
  const deleteNode = useMobileStore((state) => state.deleteNode)
  const selectedId = useMobileStore((state) => state.selectedId)
  const mobile = useMobileStore((state) => state.mobile)
  const clearSelection = useMobileStore((state) => state.clearSelection)
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete if we're in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          return
        }
        
        if (selectedId && selectedId !== mobile.id) {
          e.preventDefault()
          deleteNode(selectedId)
          clearSelection()
        }
      }
      
      if (e.key === 'Escape') {
        clearSelection()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, mobile.id, deleteNode, clearSelection])
  
  const renderPanel = () => {
    if (!selectedNode) {
      return <EmptyPanel />
    }
    
    if (selectedNode.type === 'weight') {
      return <WeightPanel weight={selectedNode} />
    }
    
    if (selectedNode.type === 'arm') {
      return <ArmPanel arm={selectedNode} />
    }
    
    return <EmptyPanel />
  }
  
  return (
    <aside className="panel">
      {renderPanel()}
    </aside>
  )
}



