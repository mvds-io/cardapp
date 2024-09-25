import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './DraggableCardApp.css';




// Basic UI components
const Card = ({ children, className, ...props }) => (
  <div className={`card ${className}`} {...props}>
    {children}
  </div>
);

const Input = ({ className, ...props }) => (
  <input className={`input ${className}`} {...props} />
);

const Button = ({ children, className, ...props }) => (
  <button className={`button ${className}`} {...props}>
    {children}
  </button>
);

// Icon components (simplified)
const X = () => <span>✖</span>;
const Edit2 = () => <span>✎</span>;
const Check = () => <span>✓</span>;

const DraggableCard = ({ id, index, heading, content, onDelete, onEdit, isEditable, moveCard }) => {
  const [isEditingHeading, setIsEditingHeading] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editedHeading, setEditedHeading] = useState(heading);
  const [editedContent, setEditedContent] = useState(content);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CARD',
    item: { id, index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const [, drop] = useDrop(() => ({
    accept: 'CARD',
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      
      if (dragIndex === hoverIndex) {
        return;
      }
      
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      
      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  }));

  const ref = React.useRef(null);
  const dragDropRef = drag(drop(ref));

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
      ref={dragDropRef}
      className={`grid-item ${isDragging ? 'dragging' : ''}`}
    >
      <div className="card-header">
        {isEditingHeading ? (
          <Input
            value={editedHeading}
            onChange={(e) => setEditedHeading(e.target.value)}
            className="mb-2"
          />
        ) : (
          <h3>{heading}</h3>
        )}
        {isEditable && (
          <Button className="button-icon" onClick={isEditingHeading ? handleSaveHeadingClick : handleEditHeadingClick}>
            {isEditingHeading ? <Check /> : <Edit2 />}
          </Button>
        )}
      </div>
      <div className="card-content">
        {isEditingContent ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="input mb-2"
          />
        ) : (
          <p>{content}</p>
        )}
        {isEditable && (
          <Button className="button-icon" onClick={isEditingContent ? handleSaveContentClick : handleEditContentClick}>
            {isEditingContent ? <Check /> : <Edit2 />}
          </Button>
        )}
      </div>
      {isEditable && (
        <div className="card-content">
          <Button className="button-icon" onClick={onDelete}>
            <X />
          </Button>
        </div>
      )}
    </Card>
  );
};

const AreaContainer = ({ title, cards, onDrop, onDelete, onEdit, moveCard }) => {
  const [, drop] = useDrop(() => ({
    accept: 'CARD',
    drop(item) {
      onDrop(item.id, title);
    },
  }));

  return (
    <div ref={drop} className="area-container">
      <h2 className="area-header">{title}</h2>
      <div className="area-content grid">
        {cards.map((card, index) => (
          <DraggableCard
            key={card.id}
            id={card.id}
            index={index}
            heading={card.heading}
            content={card.content}
            onDelete={() => onDelete(card.id)}
            onEdit={(field, newValue) => onEdit(card.id, field, newValue)}
            isEditable={title === 'Unassigned'}
            moveCard={(dragIndex, hoverIndex) => moveCard(title, dragIndex, hoverIndex)}
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

      for (const areaName in newAreas) {
        const cardIndex = newAreas[areaName].findIndex(card => card.id === cardId);
        if (cardIndex !== -1) {
          [movedCard] = newAreas[areaName].splice(cardIndex, 1);
          break;
        }
      }

      if (movedCard) {
        newAreas[targetArea] = [...newAreas[targetArea], movedCard];
      }

      return newAreas;
    });
  };

  const moveCard = (areaName, dragIndex, hoverIndex) => {
    setAreas(prevAreas => {
      const newAreas = { ...prevAreas };
      const dragCard = newAreas[areaName][dragIndex];
      newAreas[areaName].splice(dragIndex, 1);
      newAreas[areaName].splice(hoverIndex, 0, dragCard);
      return newAreas;
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container">
        <div className="card mb-2">
          <div className="card-content">
            <Input
              type="text"
              value={newAreaName}
              onChange={handleNewAreaNameChange}
              placeholder="Enter new area name"
              className="mb-2"
            />
            <Input
              type="text"
              value={inputHeading}
              onChange={handleInputHeadingChange}
              placeholder="Enter resource heading"
              className="mb-2"
            />
            <Input
              type="text"
              value={inputContent}
              onChange={handleInputContentChange}
              placeholder="Enter resource content"
              className="mb-2"
            />
            <Button onClick={handleAddNewArea} className="mr-2">Add New Area</Button>
            <Button onClick={handleAddResource}>Add Resource</Button>
          </div>
        </div>
        {Object.entries(areas).map(([areaName, cards]) => (
          <AreaContainer
            key={areaName}
            title={areaName}
            cards={cards}
            onDrop={handleDrop}
            onDelete={handleDeleteCard}
            onEdit={handleEditCard}
            moveCard={moveCard}
          />
        ))}
      </div>
    </DndProvider>
  );
};

export default App;