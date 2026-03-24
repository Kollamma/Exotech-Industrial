import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Save, Bold, Italic, Underline, GripVertical, Check, Trash2 } from "lucide-react";
import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import UnderlineExtension from "@tiptap/extension-underline";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DebugLabel } from "../../context/DebugContext";

interface Tab {
  id: string;
  position: number;
  title: string;
  content: JSONContent;
  is_locked: boolean;
  locked_by: string | null;
  locked_at: string | null;
  visible: boolean;
}

const COLORS = ["var(--color-accent)", "var(--color-text-main)", "var(--color-text-dim)", "#00FF00", "#FF4444", "#FFFFFF", "var(--color-bg-main)"];

const SortableTabItem = ({ 
  tab, 
  activeSubTab, 
  editingTab, 
  isAdmin, 
  isSuperAdmin,
  setActiveSubTab, 
  startEdit, 
  saveEdit,
  onContextMenu,
  onRestore,
  onDelete
}: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: tab.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const isEditing = editingTab === tab.id;

  return (
    <DebugLabel label="Tab Item" className="w-full">
      <div 
        ref={setNodeRef} 
        style={style} 
        onContextMenu={(e) => onContextMenu(e, tab)}
        className={`flex items-center border-b border-accent/10 ${isEditing ? "bg-accent/20" : ""} ${!tab.visible ? "opacity-40" : ""}`}
      >
        {isAdmin && (
          <div {...attributes} {...listeners} className="p-2 cursor-grab text-text-dim">
            <GripVertical size={14} />
          </div>
        )}
        <button
          onClick={() => setActiveSubTab(tab.id)}
          className={`flex-grow px-4 py-3 text-[10px] uppercase tracking-widest text-left transition-colors ${
            activeSubTab === tab.id ? "text-text-accent" : "text-text-dim hover:text-text-main"
          }`}
        >
          {tab.title} {!tab.visible && "(HIDDEN)"}
        </button>
        
        {isSuperAdmin && !tab.visible ? (
          <div className="flex items-center gap-1 pr-2">
            <button onClick={() => onRestore(tab.id)} className="p-1 text-[#00FF00] hover:bg-[#00FF00]/10 rounded transition-colors" title="Restore Visibility">
              <Check size={14} />
            </button>
            <button onClick={() => onDelete(tab.id)} className="p-1 text-[#FF4444] hover:bg-[#FF4444]/10 rounded transition-colors" title="Delete Permanently">
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          isAdmin && (
            <DebugLabel label="Edit Toggle">
              <button onClick={() => isEditing ? saveEdit(tab.id) : startEdit(tab)} className="p-2 text-text-accent">
                {isEditing ? <Save size={14} /> : <Pencil size={14} />}
              </button>
            </DebugLabel>
          )
        )}
      </div>
    </DebugLabel>
  );
};

export const TribeTab = ({ user, initialData }: { user: any, initialData?: Tab[] }) => {
  const [tabs, setTabs] = useState<Tab[]>(initialData || []);
  const [activeSubTab, setActiveSubTab] = useState<string | null>(initialData && initialData.length > 0 ? initialData[0].id : null);
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, tabId: string } | null>(null);

  const isAdmin = user && (user.rank === 1 || user.rank === 2);
  const isSuperAdmin = user && user.rank === 2;

  const fetchTabs = async () => {
    const res = await fetch('/api/tribe-tabs');
    const data = await res.json();
    setTabs(data);
    if (data.length > 0 && !activeSubTab) setActiveSubTab(data[0].id);
    else if (data.length === 0) setActiveSubTab(null);
  };

  useEffect(() => {
    if (!initialData) {
      fetchTabs();
    }
  }, [initialData]);

  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color, UnderlineExtension],
    content: "",
  });

  useEffect(() => {
    editor?.setEditable(!!editingTab);
  }, [editingTab, editor]);

  useEffect(() => {
    const tab = tabs.find(t => t.id === activeSubTab);
    if (tab) {
      editor?.commands.setContent(tab.content);
    } else {
      editor?.commands.setContent("");
    }
  }, [activeSubTab, editor, tabs]);

  const startEdit = async (tab: Tab) => {
    const lockAgeMinutes = tab.locked_at ? (new Date().getTime() - new Date(tab.locked_at).getTime()) / 1000 / 60 : 0;
    if (tab.is_locked && tab.locked_by !== user.uid && lockAgeMinutes < 30) {
      alert("This tab is currently being edited by another admin.");
      return;
    }

    await fetch(`/api/tribe-tabs/${tab.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_locked: true, locked_by: user.uid, locked_at: new Date().toISOString() })
    });

    setEditingTab(tab.id);
    setEditTitle(tab.title);
    editor?.commands.setContent(tab.content);
    fetchTabs();
  };

  const saveEdit = async (id: string) => {
    await fetch(`/api/tribe-tabs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, content: editor?.getJSON(), is_locked: false, locked_by: null, locked_at: null })
    });
    setEditingTab(null);
    setActiveSubTab(id);
    fetchTabs();
  };

  const addTab = async () => {
    const newTab = { title: "New Tab", content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "New content..." }] }] }, position: tabs.length };
    await fetch('/api/tribe-tabs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTab)
    });
    fetchTabs();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = tabs.findIndex((i) => i.id === active.id);
      const newIndex = tabs.findIndex((i) => i.id === over?.id);
      const newTabs = arrayMove(tabs, oldIndex, newIndex);
      setTabs(newTabs);

      for (let i = 0; i < newTabs.length; i++) {
        await fetch(`/api/tribe-tabs/${newTabs[i].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: i })
        });
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, tab: Tab) => {
    if (!isAdmin) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, tabId: tab.id });
  };

  const removeTab = async () => {
    if (!contextMenu) return;
    await fetch(`/api/tribe-tabs/${contextMenu.tabId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: false })
    });
    setContextMenu(null);
    fetchTabs();
  };

  const restoreTab = async (id: string) => {
    await fetch(`/api/tribe-tabs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: true })
    });
    fetchTabs();
  };

  const deleteTabPermanently = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tab forever?")) return;
    await fetch(`/api/tribe-tabs/${id}`, {
      method: 'DELETE'
    });
    if (activeSubTab === id) setActiveSubTab(null);
    fetchTabs();
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <DebugLabel label="Tribe Module" className="flex flex-col flex-grow border-t border-accent/20 overflow-hidden relative">
      <div className="flex flex-col flex-grow overflow-hidden relative">
        {isAdmin && (
          <DebugLabel label="Add Tab Button">
            <button onClick={addTab} className="p-2 text-text-main hover:text-text-accent flex items-center gap-2 text-xs uppercase tracking-widest">
              <Plus size={14} /> Add Tab
            </button>
          </DebugLabel>
        )}
        <div className="flex flex-grow overflow-hidden">
          <DebugLabel label="Sidebar" className="w-[20%] border-r border-accent/20 flex flex-col overflow-y-auto">
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={tabs.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {tabs.map((tab) => (
                  <SortableTabItem 
                    key={tab.id} 
                    tab={tab} 
                    activeSubTab={activeSubTab} 
                    editingTab={editingTab} 
                    isAdmin={isAdmin} 
                    isSuperAdmin={isSuperAdmin}
                    setActiveSubTab={setActiveSubTab} 
                    startEdit={startEdit} 
                    saveEdit={saveEdit} 
                    onContextMenu={handleContextMenu}
                    onRestore={restoreTab}
                    onDelete={deleteTabPermanently}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </DebugLabel>

          {/* Right Column (80%) */}
          <DebugLabel label="Content Area" className="w-[80%] p-6 flex flex-col relative overflow-y-auto">
            {editingTab ? (
              <>
                <DebugLabel label="Title Input">
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="text-xs uppercase tracking-widest text-text-main mb-4 bg-transparent border-b border-accent/50 outline-none w-full" />
                </DebugLabel>
                <DebugLabel label="Editor" className="flex-grow flex flex-col min-h-0">
                  <div className={`prose prose-invert prose-sm max-w-none flex-grow ${editingTab ? 'border border-accent/20 p-2' : ''} overflow-y-auto`}>
                    <EditorContent editor={editor} />
                  </div>
                </DebugLabel>
                {/* Font Tools */}
                <DebugLabel label="Editor Tools">
                  <div className="mt-4 flex items-center gap-2 bg-bg-main p-2 border border-accent/20">
                    <button onClick={() => editor?.chain().focus().toggleBold().run()} className={`p-1 ${editor?.isActive('bold') ? 'text-text-accent' : 'text-text-dim'}`}><Bold size={14} /></button>
                    <button onClick={() => editor?.chain().focus().toggleItalic().run()} className={`p-1 ${editor?.isActive('italic') ? 'text-text-accent' : 'text-text-dim'}`}><Italic size={14} /></button>
                    <button onClick={() => editor?.chain().focus().toggleUnderline().run()} className={`p-1 ${editor?.isActive('underline') ? 'text-text-accent' : 'text-text-dim'}`}><Underline size={14} /></button>
                    <div className="flex gap-1 ml-2">
                      {COLORS.map(color => (
                        <button key={color} onClick={() => editor?.chain().focus().setColor(color).run()} className="w-4 h-4 rounded-full border border-accent/20" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                </DebugLabel>
              </>
            ) : (
              <>
                <div className="text-xs uppercase tracking-widest text-text-main mb-4">
                  {tabs.find(t => t.id === activeSubTab)?.title}
                </div>
                <div className="prose prose-invert prose-sm max-w-none text-[10px] uppercase tracking-widest text-text-dim leading-relaxed overflow-y-auto">
                  <EditorContent editor={editor} />
                </div>
              </>
            )}
          </DebugLabel>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-50 bg-bg-main border border-accent/20 shadow-xl py-1 min-w-[120px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button 
            onClick={removeTab}
            className="w-full text-left px-4 py-2 text-[10px] uppercase tracking-widest text-[#FF4444] hover:bg-[#FF4444]/10 transition-colors"
          >
            Remove Tab
          </button>
        </div>
      )}
    </DebugLabel>
  );
};
