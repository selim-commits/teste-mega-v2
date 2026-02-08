import type { ReactNode } from 'react';
import { Package, MapPin, MoreVertical, Edit2, QrCode, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Dropdown, DropdownItem, DropdownDivider } from '../../components/ui/Dropdown';
import type { Equipment, Space } from '../../types/database';
import styles from '../Inventory.module.css';

interface BySpaceViewProps {
  isLoading: boolean;
  filteredEquipment: Equipment[];
  spaces: Space[] | undefined;
  equipmentCountsBySpace: Record<string, number>;
  getStatusBadge: (status: Equipment['status']) => ReactNode;
  openEditModal: (item: Equipment) => void;
  openQrModal: (item: Equipment) => void;
  openDeleteModal: (item: Equipment) => void;
}

export function BySpaceView({
  isLoading,
  filteredEquipment,
  spaces,
  equipmentCountsBySpace,
  getStatusBadge,
  openEditModal,
  openQrModal,
  openDeleteModal,
}: BySpaceViewProps) {
  if (isLoading) {
    return (
      <div className={styles.bySpaceView}>
        <div className={styles.emptyState}>
          <Package size={48} />
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.bySpaceView}>
      {/* Unassigned equipment section */}
      {equipmentCountsBySpace.unassigned > 0 && (
        <div className={styles.spaceSection}>
          <div className={styles.spaceSectionHeader}>
            <div className={styles.spaceSectionTitle}>
              <MapPin size={20} />
              <h3>Non assignés</h3>
              <Badge variant="default" size="sm">
                {equipmentCountsBySpace.unassigned}
              </Badge>
            </div>
          </div>
          <div className={styles.itemsGrid}>
            {filteredEquipment
              .filter((e) => !e.space_id)
              .map((item) => (
                <Card key={item.id} padding="none" hoverable className={styles.itemCard}>
                  <div className={styles.itemImage}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} />
                    ) : (
                      <Package size={40} className={styles.itemPlaceholder} />
                    )}
                  </div>
                  <div className={styles.itemContent}>
                    <div className={styles.itemHeader}>
                      <h4 className={styles.itemName}>{item.name}</h4>
                      <Dropdown
                        trigger={
                          <button className={styles.itemMenu} aria-label="Plus d'options">
                            <MoreVertical size={16} />
                          </button>
                        }
                        align="end"
                      >
                        <DropdownItem icon={<Edit2 size={16} />} onClick={() => openEditModal(item)}>
                          Modifier
                        </DropdownItem>
                        <DropdownItem icon={<QrCode size={16} />} onClick={() => openQrModal(item)}>
                          Voir QR Code
                        </DropdownItem>
                        <DropdownDivider />
                        <DropdownItem
                          icon={<Trash2 size={16} />}
                          destructive
                          onClick={() => openDeleteModal(item)}
                        >
                          Supprimer
                        </DropdownItem>
                      </Dropdown>
                    </div>
                    <span className={styles.categoryBadge}>{item.category}</span>
                    {getStatusBadge(item.status)}
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Assigned equipment sections by space */}
      {spaces?.map((space) => {
        const spaceEquipment = filteredEquipment.filter((e) => e.space_id === space.id);
        if (spaceEquipment.length === 0) return null;

        return (
          <div key={space.id} className={styles.spaceSection}>
            <div className={styles.spaceSectionHeader}>
              <div className={styles.spaceSectionTitle}>
                <MapPin size={20} style={{ color: space.color }} />
                <h3>{space.name}</h3>
                <Badge variant="default" size="sm">
                  {spaceEquipment.length}
                </Badge>
              </div>
            </div>
            <div className={styles.itemsGrid}>
              {spaceEquipment.map((item) => (
                <Card key={item.id} padding="none" hoverable className={styles.itemCard}>
                  <div className={styles.itemImage}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} />
                    ) : (
                      <Package size={40} className={styles.itemPlaceholder} />
                    )}
                  </div>
                  <div className={styles.itemContent}>
                    <div className={styles.itemHeader}>
                      <h4 className={styles.itemName}>{item.name}</h4>
                      <Dropdown
                        trigger={
                          <button className={styles.itemMenu} aria-label="Plus d'options">
                            <MoreVertical size={16} />
                          </button>
                        }
                        align="end"
                      >
                        <DropdownItem icon={<Edit2 size={16} />} onClick={() => openEditModal(item)}>
                          Modifier
                        </DropdownItem>
                        <DropdownItem icon={<QrCode size={16} />} onClick={() => openQrModal(item)}>
                          Voir QR Code
                        </DropdownItem>
                        <DropdownDivider />
                        <DropdownItem
                          icon={<Trash2 size={16} />}
                          destructive
                          onClick={() => openDeleteModal(item)}
                        >
                          Supprimer
                        </DropdownItem>
                      </Dropdown>
                    </div>
                    <span className={styles.categoryBadge}>{item.category}</span>
                    {getStatusBadge(item.status)}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
