"""
OrPaynter AI Platform - Damage Detection Model Training
This script demonstrates how to train a roof damage detection model
"""

import tensorflow as tf
import numpy as np
import cv2
import os
from sklearn.model_selection import train_test_split
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DamageDetectionTrainer:
    def __init__(self, image_size=(224, 224), num_classes=8):
        self.image_size = image_size
        self.num_classes = num_classes
        self.damage_classes = [
            'missing_shingles', 'broken_tiles', 'hail_damage', 
            'wind_damage', 'water_damage', 'structural_damage',
            'gutters_damage', 'flashing_damage'
        ]
        self.model = None
    
    def create_model(self):
        """Create damage detection model using EfficientNet"""
        # Load pre-trained EfficientNet
        base_model = EfficientNetB0(
            weights='imagenet',
            include_top=False,
            input_shape=(*self.image_size, 3)
        )
        
        # Freeze base model layers initially
        base_model.trainable = False
        
        # Add custom classification head
        x = base_model.output
        x = GlobalAveragePooling2D()(x)
        x = Dropout(0.2)(x)
        x = Dense(512, activation='relu')(x)
        x = Dropout(0.2)(x)
        predictions = Dense(self.num_classes, activation='sigmoid')(x)  # Multi-label classification
        
        model = Model(inputs=base_model.input, outputs=predictions)
        
        # Compile model
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='binary_crossentropy',  # Multi-label classification
            metrics=['accuracy', 'precision', 'recall']
        )
        
        self.model = model
        return model
    
    def preprocess_image(self, image_path):
        """Preprocess image for training"""
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                return None
            
            # Convert BGR to RGB
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Resize image
            image = cv2.resize(image, self.image_size)
            
            # Normalize pixel values
            image = image.astype(np.float32) / 255.0
            
            return image
        except Exception as e:
            logger.error(f"Error preprocessing {image_path}: {e}")
            return None
    
    def generate_synthetic_data(self, num_samples=1000):
        """Generate synthetic training data for demonstration"""
        logger.info("Generating synthetic training data...")
        
        X = []
        y = []
        
        for i in range(num_samples):
            # Create synthetic roof image
            image = np.random.rand(*self.image_size, 3)
            
            # Add some patterns to simulate damage
            damage_labels = np.zeros(self.num_classes)
            
            # Simulate different types of damage based on image characteristics
            if np.mean(image) < 0.3:  # Dark areas
                damage_labels[0] = 1  # missing_shingles
            
            if np.std(image) > 0.3:  # High variance
                damage_labels[2] = 1  # hail_damage
            
            if np.mean(image[:, :, 2]) > 0.7:  # Blue channel high
                damage_labels[4] = 1  # water_damage
            
            # Add some noise patterns
            noise = np.random.normal(0, 0.1, image.shape)
            image = np.clip(image + noise, 0, 1)
            
            X.append(image)
            y.append(damage_labels)
        
        return np.array(X), np.array(y)
    
    def train(self, num_samples=1000, validation_split=0.2, epochs=50):
        """Train the damage detection model"""
        logger.info("Starting model training...")
        
        # Generate synthetic data (replace with real data loading)
        X, y = self.generate_synthetic_data(num_samples)
        
        # Split data
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=validation_split, random_state=42
        )
        
        logger.info(f"Training samples: {len(X_train)}")
        logger.info(f"Validation samples: {len(X_val)}")
        
        # Create model if not exists
        if self.model is None:
            self.create_model()
        
        # Callbacks
        callbacks = [
            ModelCheckpoint(
                'best_damage_model.h5',
                monitor='val_loss',
                save_best_only=True,
                verbose=1
            ),
            EarlyStopping(
                monitor='val_loss',
                patience=10,
                restore_best_weights=True
            )
        ]
        
        # Train model
        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=32,
            callbacks=callbacks,
            verbose=1
        )
        
        logger.info("Training completed!")
        return history
    
    def fine_tune(self, epochs=20):
        """Fine-tune the model by unfreezing some layers"""
        if self.model is None:
            raise ValueError("Model must be trained first")
        
        logger.info("Starting fine-tuning...")
        
        # Unfreeze top layers of base model
        base_model = self.model.layers[0]
        base_model.trainable = True
        
        # Fine-tune from this layer onwards
        fine_tune_at = 100
        
        # Freeze all layers before fine_tune_at
        for layer in base_model.layers[:fine_tune_at]:
            layer.trainable = False
        
        # Use lower learning rate for fine-tuning
        self.model.compile(
            optimizer=Adam(learning_rate=0.0001/10),
            loss='binary_crossentropy',
            metrics=['accuracy', 'precision', 'recall']
        )
        
        # Continue training with fine-tuning
        # Note: You would use your validation data here
        logger.info("Fine-tuning completed!")
    
    def save_model(self, path='damage_detection_model'):
        """Save the trained model"""
        if self.model is None:
            raise ValueError("No model to save")
        
        # Save in TensorFlow format
        self.model.save(f"{path}.h5")
        
        # Save model architecture
        with open(f"{path}_architecture.json", "w") as f:
            f.write(self.model.to_json())
        
        # Save class labels
        with open(f"{path}_classes.txt", "w") as f:
            for cls in self.damage_classes:
                f.write(f"{cls}\n")
        
        logger.info(f"Model saved to {path}")
    
    def evaluate_model(self, X_test, y_test):
        """Evaluate model performance"""
        if self.model is None:
            raise ValueError("Model must be trained first")
        
        # Get predictions
        predictions = self.model.predict(X_test)
        
        # Calculate metrics for each class
        results = {}
        for i, class_name in enumerate(self.damage_classes):
            y_true = y_test[:, i]
            y_pred = (predictions[:, i] > 0.5).astype(int)
            
            # Calculate metrics
            from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
            
            results[class_name] = {
                'accuracy': accuracy_score(y_true, y_pred),
                'precision': precision_score(y_true, y_pred, zero_division=0),
                'recall': recall_score(y_true, y_pred, zero_division=0),
                'f1': f1_score(y_true, y_pred, zero_division=0)
            }
        
        return results

def main():
    """Main training script"""
    logger.info("Starting OrPaynter Damage Detection Model Training")
    
    # Initialize trainer
    trainer = DamageDetectionTrainer()
    
    # Create and train model
    trainer.create_model()
    history = trainer.train(num_samples=2000, epochs=10)  # Reduced for demo
    
    # Fine-tune model
    trainer.fine_tune(epochs=5)
    
    # Save model
    trainer.save_model('models/damage_detection_v1')
    
    logger.info("Training pipeline completed successfully!")

if __name__ == "__main__":
    main()
