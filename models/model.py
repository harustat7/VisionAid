import os, glob, cv2
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import math
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow.keras.layers import *
from tensorflow.keras import backend as K
from tensorflow.keras.models import Sequential
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.utils import get_custom_objects
from sklearn.metrics import *
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.metrics import roc_curve
import efficientnet.tfkeras as efn
from tqdm import tqdm

SEED = 42
EPOCHS = 100
BATCH_SIZE = 32
IMG_HEIGHT = 192
IMG_WIDTH = 256

# cataract dataset
IMG_ROOT = 'dataset'
IMG_DIR = [
    os.path.normpath("dataset/1_normal"), 
    os.path.normpath("dataset/2_cataract"), 
    os.path.normpath("dataset/3_glaucoma"), 
    os.path.normpath("dataset/4_retina_disease")
]

# ocular-disease-recognition dataset
OCU_IMG_ROOT = r"C:\\Users\\harus\Desktop\\PROJECTS\\cd_dataset\\OD\\Training Images\\"
ocu_df = pd.read_excel('OD/data.xlsx')



def seed_everything(seed):
    np.random.seed(seed)
    os.environ['PYTHONHASHSEED'] = str(seed)
    tf.random.set_seed(seed)

seed_everything(SEED)


# Process Cataract dataset 
cat_df = pd.DataFrame({'paths': [''] * 201, 'cataract': [0] * 201})
filepaths = glob.glob(os.path.join(IMG_ROOT, '*/*'))

# Create an empty list to store data
data = []

for filepath in filepaths:
    filepath = os.path.normpath(filepath)  # Normalize path (handles '/' and '\')
    folder, filename = os.path.split(filepath)
    
    # Assign labels based on folder match
    if folder == IMG_DIR[0]:    
        label = 0  # Normal
    elif folder == IMG_DIR[1]:  
        label = 1  # Cataract
    elif folder == IMG_DIR[2]:  
        label = 2  # Glaucoma
    elif folder == IMG_DIR[3]:  
        label = 3  # Retina Disease
    else:
        continue  # Skip files in unknown directories
    
    data.append([filepath, label])

# Convert list to DataFrame
cat_df = pd.DataFrame(data, columns=['paths', 'cataract'])

# Filter only Normal (0) and Cataract (1)
cat_df = cat_df.query('0 <= cataract < 2')

print(cat_df)

print('Number of normal and cataract images')
print(cat_df['cataract'].value_counts())



# Process Ocular disease recognition dataset
print(ocu_df.head())


def has_cataract_mentioned(text):
    text=text.lower()
    if 'cataract' in text:
        return 1
    else:
        return 0
    
ocu_df['left_eye_cataract'] = ocu_df['Left-Diagnostic Keywords']\
                                 .apply(lambda x: has_cataract_mentioned(x))
ocu_df['right_eye_cataract'] = ocu_df['Right-Diagnostic Keywords']\
                                 .apply(lambda x: has_cataract_mentioned(x))

le_df = ocu_df.loc[:, ['Left-Fundus', 'left_eye_cataract']]\
        .rename(columns={'left_eye_cataract':'cataract'})
le_df['paths'] = OCU_IMG_ROOT + le_df['Left-Fundus']
le_df = le_df.drop('Left-Fundus', axis=1)


re_df = ocu_df.loc[:, ['Right-Fundus', 'right_eye_cataract']]\
        .rename(columns={'right_eye_cataract':'cataract'})
re_df['paths'] = OCU_IMG_ROOT + re_df['Right-Fundus']
re_df = re_df.drop('Right-Fundus', axis=1)

print(le_df.head())
print(re_df.head())

print('Number of left eye images')
print(le_df['cataract'].value_counts())
print('\nNumber of right eye images')
print(re_df['cataract'].value_counts())

# DownSampling
def downsample(df):
    df = pd.concat([
        df.query('cataract==1'),
        df.query('cataract==0').sample(sum(df['cataract']), 
                                       random_state=SEED)
    ])
    return df


le_df = downsample(le_df)
re_df = downsample(re_df)

print('Number of left eye images')
print(le_df['cataract'].value_counts())
print('\nNumber of right eye images')
print(re_df['cataract'].value_counts())

ocu_df = pd.concat([le_df, re_df])
print(ocu_df.head())

# Create Datasets
df = pd.concat([cat_df, ocu_df], ignore_index=True)
print(df)

train_df, test_df = train_test_split(df, 
                                     test_size=0.2, 
                                     random_state=SEED, 
                                     stratify=df['cataract'])

train_df, val_df = train_test_split(train_df,
                                    test_size=0.15,
                                    random_state=SEED,
                                    stratify=train_df['cataract'])

def create_datasets(df, img_width, img_height):
    imgs = []
    valid_paths = []

    for path in tqdm(df['paths']):
        if not os.path.exists(path):
            print(f"⚠️ Warning: File not found -> {path}")
            continue
        img = cv2.imread(path)

        if img is None:
            print(f"⚠️ Warning: OpenCV couldn't read -> {path}")
            continue 
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (img_width, img_height))
        imgs.append(img)
        valid_paths.append(path)

    imgs = np.array(imgs, dtype='float32')

    df = df[df['paths'].isin(valid_paths)]

    df = pd.get_dummies(df['cataract'])
    return imgs, df

df['paths'] = df['paths'].apply(lambda x: os.path.abspath(os.path.normpath(x)))


train_imgs, train_df = create_datasets(train_df, IMG_WIDTH, IMG_HEIGHT)
val_imgs, val_df = create_datasets(val_df, IMG_WIDTH, IMG_HEIGHT)
test_imgs, test_df = create_datasets(test_df, IMG_WIDTH, IMG_HEIGHT)

train_imgs = train_imgs / 255.0
val_imgs = val_imgs / 255.0
test_imgs = test_imgs / 255.0

# image data for train
f, ax = plt.subplots(5, 5, figsize=(15,15))
norm_list = list(train_df[0][:25])
for i, img in enumerate(train_imgs[:25]):
    ax[i//5, i%5].imshow(img)
    ax[i//5, i%5].axis('off')
    if norm_list[i] == 1:
        ax[i//5, i%5].set_title('TrainData: Normal')
    else:
        ax[i//5, i%5].set_title('TrainData: Cataract')
plt.show(block=False)

# image data for test
f, ax = plt.subplots(5, 5, figsize=(15,15))
norm_list = list(test_df[0][:25])
for i, img in enumerate(test_imgs[:25]):
    ax[i//5, i%5].imshow(img)
    ax[i//5, i%5].axis('off')
    if norm_list[i] == 1:
        ax[i//5, i%5].set_title('TestData: Normal')
    else:
        ax[i//5, i%5].set_title('TestData: Cataract')
plt.show(block=False)


# Build the first model
class Mish(tf.keras.layers.Layer):

    def __init__(self, **kwargs):
        super(Mish, self).__init__(**kwargs)
        self.supports_masking = True

    def call(self, inputs):
        return inputs * K.tanh(K.softplus(inputs))

    def get_config(self):
        base_config = super(Mish, self).get_config()
        return dict(list(base_config.items()) + list(config.items()))

    def compute_output_shape(self, input_shape):
        return input_shape
def mish(x):
    return tf.keras.layers.Lambda(lambda x: x*K.tanh(K.softplus(x)))(x)
 
get_custom_objects().update({'mish': Activation(mish)})

input_shape = (IMG_HEIGHT, IMG_WIDTH, 3)

model = Sequential()
model.add(Conv2D(16, kernel_size=3, padding='same', 
                 input_shape=input_shape, activation='mish'))
model.add(Conv2D(16, kernel_size=3, padding='same', activation='mish'))
model.add(BatchNormalization())
model.add(MaxPool2D(3))
model.add(Dropout(0.3))
model.add(Conv2D(16, kernel_size=3, padding='same', activation='mish'))
model.add(Conv2D(16, kernel_size=3, padding='same', activation='mish'))
model.add(BatchNormalization())
model.add(MaxPool2D(3))
model.add(Dropout(0.3))
model.add(Flatten())
model.add(Dense(2, activation='softmax'))
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])


model.summary()

train_labels = np.array(train_df)
val_labels = np.array(val_df)
generator = ImageDataGenerator(horizontal_flip=True, 
                               height_shift_range=0.1,
                               fill_mode='reflect') 



es_callback = tf.keras.callbacks.EarlyStopping(patience=20, 
                                               verbose=1, 
                                               restore_best_weights=True)
reduce_lr = tf.keras.callbacks.ReduceLROnPlateau(factor=0.1, patience=10, verbose=1)

steps_per_epoch = math.ceil(len(train_imgs) / BATCH_SIZE)

# Debugging prints
print(f"Train images shape: {train_imgs.shape}")
print(f"Train labels shape: {train_labels.shape}")
print(f"Batch size: {BATCH_SIZE}")
print(f"Steps per epoch: {steps_per_epoch}")

history = model.fit(generator.flow(train_imgs, 
                                   train_labels,
                                   batch_size=BATCH_SIZE), 
                    epochs=EPOCHS,
                    steps_per_epoch=steps_per_epoch,
                    callbacks=[es_callback, reduce_lr],
                    validation_data=(val_imgs, val_labels))

pd.DataFrame(history.history)[['accuracy', 'val_accuracy']].plot()
plt.title("Model Accuracy")
plt.xlabel("Epochs")
plt.ylabel("Accuracy")
plt.legend(["Train", "Validation"])
plt.show(block=False)

# Plot loss
pd.DataFrame(history.history)[['loss', 'val_loss']].plot()
plt.title("Model Loss")
plt.xlabel("Epochs")
plt.ylabel("Loss")
plt.legend(["Train", "Validation"])
plt.show(block=False)

print(model.evaluate(test_imgs, test_df)) 
loss, accuracy = model.evaluate(test_imgs, test_df)
print(f"Test Accuracy: {accuracy * 100:.2f}%")


#build the second model
def build_model(img_height, img_width, n):
    inp = Input(shape=(img_height,img_width,n))
    efnet = efn.EfficientNetB0(
        input_shape=(img_height,img_width,n), 
        weights='imagenet', 
        include_top=False
    )
    x = efnet(inp)
    x = GlobalAveragePooling2D()(x)
    x = Dense(2, activation='softmax')(x)
    model = tf.keras.Model(inputs=inp, outputs=x)
    opt = tf.keras.optimizers.Adam(learning_rate=0.000003)
    loss = tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.01)
    model.compile(optimizer=opt, loss=loss, metrics=['accuracy'])
    return model

model2 = build_model(IMG_HEIGHT, IMG_WIDTH, 3)
model2.summary()

train_labels = np.array(train_df)
val_labels = np.array(val_df)

generator = ImageDataGenerator(horizontal_flip=True, 
                               height_shift_range=0.1,
                               fill_mode='reflect') 



es_callback = tf.keras.callbacks.EarlyStopping(patience=20, 
                                               verbose=1, 
                                               restore_best_weights=True)
reduce_lr = tf.keras.callbacks.ReduceLROnPlateau(factor=0.1, patience=10, verbose=1)

steps_per_epoch = math.ceil(len(train_imgs) / BATCH_SIZE)

# Debugging prints
print(f"Train images shape: {train_imgs.shape}")
print(f"Train labels shape: {train_labels.shape}")
print(f"Batch size: {BATCH_SIZE}")
print(f"Steps per epoch: {steps_per_epoch}")

history = model2.fit(generator.flow(train_imgs, 
                                   train_labels,
                                   batch_size=BATCH_SIZE), 
                    epochs=EPOCHS,
                    steps_per_epoch=steps_per_epoch,
                    callbacks=[es_callback, reduce_lr],
                    validation_data=(val_imgs, val_labels))

pd.DataFrame(history.history)[['accuracy', 'val_accuracy']].plot()
plt.title("Model Accuracy")
plt.xlabel("Epochs")
plt.ylabel("Accuracy")
plt.legend(["Train", "Validation"])
plt.show(block=False)

# Plot loss
pd.DataFrame(history.history)[['loss', 'val_loss']].plot()
plt.title("Model Loss")
plt.xlabel("Epochs")
plt.ylabel("Loss")
plt.legend(["Train", "Validation"])
plt.show(block=False)

print(model2.evaluate(test_imgs, test_df)) 
loss, accuracy = model2.evaluate(test_imgs, test_df)
print(f"Test Accuracy: {accuracy * 100:.2f}%")


# saving the first model
model.save("model.h5")

# saving the second model
model2.save("model2.h5")

# Loading the models
model = load_model('model.h5') 
model2 = load_model('model2.h5')


# Predict probabilities
y_pred1_probs = model.predict(test_imgs)  # Model 1 predictions
y_pred2_probs = model2.predict(test_imgs)  # Model 2 predictions

# Convert probabilities to class labels (Threshold 0.5 for binary classification)
y_pred1 = (y_pred1_probs > 0.5).astype(int)
y_pred2 = (y_pred2_probs > 0.5).astype(int)

# Define a function to evaluate the model
# X_train, X_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42)
def evaluate_model(y_true, y_pred, model_name):
    print(f"\n🔍 Evaluation Metrics for {model_name}:")
    print(f"Accuracy: {accuracy_score(y_true, y_pred):.4f}")
    print(f"Precision: {precision_score(y_true, y_pred):.4f}")
    print(f"Recall (Sensitivity): {recall_score(y_true, y_pred):.4f}")
    print(f"F1 Score: {f1_score(y_true, y_pred):.4f}")
    print(f"ROC AUC Score: {roc_auc_score(y_true, y_pred):.4f}")
    print(f"Confusion Matrix:\n{confusion_matrix(y_true, y_pred)}")

# Evaluate both models
evaluate_model(train_labels, y_pred1, "Model 1")
evaluate_model(train_labels, y_pred2, "Model 2")

# Compute ROC curve
fpr1, tpr1, _ = roc_curve(train_labels, y_pred1_probs)
fpr2, tpr2, _ = roc_curve(train_labels, y_pred2_probs)

# Plot ROC curve
plt.figure(figsize=(8, 6))
plt.plot(fpr1, tpr1, label='Model 1 (AUC = {:.2f})'.format(roc_auc_score(train_labels, y_pred1_probs)))
plt.plot(fpr2, tpr2, label='Model 2 (AUC = {:.2f})'.format(roc_auc_score(train_labels, y_pred2_probs)))
plt.plot([0, 1], [0, 1], 'k--')  # Random classifier line
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('ROC Curve')
plt.legend()
plt.show()