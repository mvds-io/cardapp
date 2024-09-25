import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Edit2, Check } from 'lucide-react';

const DraggableCard = ({ id, heading, content, onDragStart, onDelete, onEdit, isEditable }) => {
  const [isEditingHeading, setIsEditingHeading] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editedHeading, setEditedHeading] = useState(heading);
  const [editedContent, setEditedContent] = useState(content);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'card',
    item: { id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const handleEditHeadingClick = () => setIsEditingHeading(true);
  const handleEditContentClick = () => setIsEditingContent(true);

  const handleSaveHeadingClick = () => {
    onEdit('heading', editedHeading);
    setIsEditingHeading(false);
  };

  const handleSaveContentClick = () => {
    onEdit('content', editedContent);
    setIsEditingContent(false);
  };

  return (
    <Card
      ref={drag}
      className={`m-1 w-60 inline-flex flex-col justify-between cursor-move bg-white shadow-md rounded-lg transition-shadow hover:shadow-lg overflow-hidden ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="bg-blue-100 p-2">
        {isEditingHeading ? (
          <Input
            value={editedHeading}
            onChange={(e) => setEditedHeading(e.target.value)}
            className="text-sm font-bold mb-1"
          />
        ) : (
          <h3 className="text-sm font-bold truncate">{heading}</h3>
        )}
        {isEditable && (
          <Button variant="ghost" size="icon" onClick={isEditingHeading ? handleSaveHeadingClick : handleEditHeadingClick}>
            {isEditingHeading ? <Check className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
          </Button>
        )}
      </div>
      <div className="p-2">
        {isEditingContent ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="text-sm w-full h-20 p-1 border rounded"
          />
        ) : (
          <p className="text-sm overflow-hidden h-20">{content}</p>
        )}
        {isEditable && (
          <Button variant="ghost" size="icon" onClick={isEditingContent ? handleSaveContentClick : handleEditContentClick}>
            {isEditingContent ? <Check className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
          </Button>
        )}
      </div>
      {isEditable && (
        <div className="flex justify-end p-2">
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </Card>
  );
};

const AreaContainer = ({ title, cards, onDrop, onDelete, onEdit }) => {
  const [, drop] = useDrop(() => ({
    accept: 'card',
    drop: (item) => onDrop(item.id, title),
  }));

  return (
    <div
      ref={drop}
      className="w-full bg-white rounded-lg shadow-md min-h-[300px] mb-6 overflow-hidden"
    >
      <h2 className="text-lg font-bold mb-4 p-4 bg-green-100">{title}</h2>
      <div className="flex flex-wrap p-4">
        {cards.map((card, index) => (
          <DraggableCard
            key={card.id}
            id={card.id}
            heading={card.heading}
            content={card.content}
            onDelete={() => onDelete(card.id)}
            onEdit={(field, newValue) => onEdit(card.id, field, newValue)}
            isEditable={title === 'Unassigned'}
          />
        ))}
      </div>
    </div>
  );
};

const App = () => {
  const [inputHeading, setInputHeading] = useState('');
  const [inputContent, setInputContent] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [areas, setAreas] = useState({
    'Unassigned': []
  });
  const [nextCardId, setNextCardId] = useState(1);

  const handleInputHeadingChange = (e) => setInputHeading(e.target.value);
  const handleInputContentChange = (e) => setInputContent(e.target.value);
  const handleNewAreaNameChange = (e) => setNewAreaName(e.target.value);

  const handleAddResource = () => {
    if (inputHeading.trim() !== '') {
      setAreas(prevAreas => ({
        ...prevAreas,
        'Unassigned': [...prevAreas['Unassigned'], { id: nextCardId, heading: inputHeading, content: inputContent }]
      }));
      setNextCardId(prevId => prevId + 1);
      setInputHeading('');
      setInputContent('');
    }
  };

  const handleAddNewArea = () => {
    if (newAreaName.trim() !== '' && !areas.hasOwnProperty(newAreaName)) {
      setAreas(prevAreas => ({
        ...prevAreas,
        [newAreaName]: []
      }));
      setNewAreaName('');
    }
  };

  const handleDeleteCard = (cardId) => {
    setAreas(prevAreas => {
      const newAreas = { ...prevAreas };
      for (const areaName in newAreas) {
        newAreas[areaName] = newAreas[areaName].filter(card => card.id !== cardId);
      }
      return newAreas;
    });
  };

  const handleEditCard = (cardId, field, newValue) => {
    setAreas(prevAreas => {
      const newAreas = { ...prevAreas };
      for (const areaName in newAreas) {
        newAreas[areaName] = newAreas[areaName].map(card => 
          card.id === cardId ? { ...card, [field]: newValue } : card
        );
      }
      return newAreas;
    });
  };

  const handleDrop = (cardId, targetArea) => {
    setAreas(prevAreas => {
      const newAreas = { ...prevAreas };
      let movedCard;

      // Find and remove the card from its original area
      for (const areaName in newAreas) {
        const cardIndex = newAreas[areaName].findIndex(card => card.id === cardId);
        if (cardIndex !== -1) {
          [movedCard] = newAreas[areaName].splice(cardIndex, 1);
          break;
        }
      }

      // Add the card to the target area
      if (movedCard) {
        newAreas[targetArea] = [...newAreas[targetArea], movedCard];
      }

      return newAreas;
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
        <div className="mb-6 bg-white p-4 rounded-lg shadow-md flex flex-wrap items-end">
          <div className="w-full md:w-1/4 mb-2 md:mb-0 md:mr-2">
            <Input
              type="text"
              value={newAreaName}
              onChange={handleNewAreaNameChange}
              placeholder="Enter new area name"
              className="w-full"
            />
          </div>
          <div className="w-full md:w-1/4 mb-2 md:mb-0 md:mr-2">
            <Input
              type="text"
              value={inputHeading}
              onChange={handleInputHeadingChange}
              placeholder="Enter resource heading"
              className="w-full"
            />
          </div>
          <div className="w-full md:w-1/4 mb-2 md:mb-0 md:mr-2">
            <Input
              type="text"
              value={inputContent}
              onChange={handleInputContentChange}
              placeholder="Enter resource content"
              className="w-full"
            />
          </div>
          <div className="w-full md:w-auto">
            <Button onClick={handleAddNewArea} className="mr-2 mb-2 md:mb-0">Add New Area</Button>
            <Button onClick={handleAddResource}>Add Resource</Button>
          </div>
        </div>
        <div className="flex flex-wrap -mx-3">
          {Object.entries(areas).map(([areaName, cards]) => (
            <div key={areaName} className="w-full px-3 mb-6">
              <AreaContainer
                title={areaName}
                cards={cards}
                onDrop={handleDrop}
                onDelete={handleDeleteCard}
                onEdit={handleEditCard}
              />
            </div>
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

export default App;